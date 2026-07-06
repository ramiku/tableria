import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  and,
  asc,
  conversationMembers,
  conversations,
  desc,
  eq,
  gameCategories,
  gameContent,
  games,
  ilike,
  inArray,
  matchChatMessages,
  matchPlayers,
  matches,
  messages,
  ne,
  or,
  sql,
  userReports,
  users,
  type Db,
} from '@tableria/db';
import { logAdminAction, listAdminAuditLog } from '../../admin/audit.js';
import { banUser, unbanUser } from '../../moderation/ban.js';
import * as reputation from '../../reputation/service.js';
import { getMaintenanceStatus, setMaintenanceStatus } from '../../settings/service.js';
import { adminProcedure, router } from '../trpc.js';

async function usersById(db: Db, ids: string[]) {
  if (ids.length === 0) return new Map<string, { username: string; displayName: string }>();
  const rows = await db
    .select({ id: users.id, username: users.username, displayName: users.displayName })
    .from(users)
    .where(inArray(users.id, ids));
  return new Map(rows.map((r) => [r.id, { username: r.username, displayName: r.displayName }]));
}

const playersRouter = router({
  search: adminProcedure.input(z.object({ query: z.string().trim().min(1).max(100) })).query(async ({ ctx, input }) => {
    const like = `%${input.query}%`;
    return ctx.db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        reputation: users.reputation,
        disabledAt: users.disabledAt,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(or(ilike(users.username, like), ilike(users.email, like), ilike(users.displayName, like)))
      .limit(20);
  }),

  get: adminProcedure.input(z.object({ userId: z.uuid() })).query(async ({ ctx, input }) => {
    const [user] = await ctx.db.select().from(users).where(eq(users.id, input.userId)).limit(1);
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

    const recentMatches = await ctx.db
      .select({ id: matches.id, gameId: matches.gameId, state: matches.state, createdAt: matches.createdAt })
      .from(matches)
      .innerJoin(matchPlayers, eq(matchPlayers.matchId, matches.id))
      .where(eq(matchPlayers.userId, input.userId))
      .orderBy(desc(matches.createdAt))
      .limit(20);

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      reputation: user.reputation,
      disabledAt: user.disabledAt,
      disabledReason: user.disabledReason,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      recentMatches,
    };
  }),

  setReputation: adminProcedure
    .input(z.object({ userId: z.uuid(), value: z.number().int().min(1).max(100), reason: z.string().trim().min(1).max(300) }))
    .mutation(async ({ ctx, input }) => {
      await reputation.adminSetReputation(ctx.db, {
        adminUserId: ctx.user.id,
        targetUserId: input.userId,
        newValue: input.value,
        reason: input.reason,
      });
      return { ok: true };
    }),

  ban: adminProcedure
    .input(z.object({ userId: z.uuid(), reason: z.string().trim().min(1).max(300) }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No puedes banearte a ti mismo' });
      }
      await banUser(ctx.db, { adminUserId: ctx.user.id, targetUserId: input.userId, reason: input.reason });
      return { ok: true };
    }),

  unban: adminProcedure.input(z.object({ userId: z.uuid() })).mutation(async ({ ctx, input }) => {
    await unbanUser(ctx.db, { adminUserId: ctx.user.id, targetUserId: input.userId });
    return { ok: true };
  }),

  /** Todos los chats en los que ha participado: mesas (con mensajes) y conversaciones directas. */
  chats: adminProcedure.input(z.object({ userId: z.uuid() })).query(async ({ ctx, input }) => {
    const matchChats = await ctx.db
      .select({
        matchId: matches.id,
        gameId: matches.gameId,
        state: matches.state,
        messageCount: sql<number>`count(${matchChatMessages.id})::int`,
        lastMessageAt: sql<string>`max(${matchChatMessages.createdAt})`,
      })
      .from(matchPlayers)
      .innerJoin(matches, eq(matches.id, matchPlayers.matchId))
      .innerJoin(matchChatMessages, eq(matchChatMessages.matchId, matches.id))
      .where(eq(matchPlayers.userId, input.userId))
      .groupBy(matches.id)
      .orderBy(sql`max(${matchChatMessages.createdAt}) desc`);

    const directRows = await ctx.db
      .select({ conversationId: conversations.id, lastMessageAt: conversations.lastMessageAt })
      .from(conversationMembers)
      .innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId))
      .where(and(eq(conversationMembers.userId, input.userId), eq(conversations.type, 'direct')))
      .orderBy(desc(conversations.lastMessageAt));

    const conversationIds = directRows.map((r) => r.conversationId);
    const otherMemberRows =
      conversationIds.length === 0
        ? []
        : await ctx.db
            .select({ conversationId: conversationMembers.conversationId, userId: conversationMembers.userId })
            .from(conversationMembers)
            .where(and(inArray(conversationMembers.conversationId, conversationIds), ne(conversationMembers.userId, input.userId)));

    const otherUsersLookup = await usersById(ctx.db, [...new Set(otherMemberRows.map((r) => r.userId))]);
    const otherByConversation = new Map(
      otherMemberRows.map((r) => [r.conversationId, otherUsersLookup.get(r.userId) ?? null]),
    );

    const directChats = directRows.map((r) => ({
      conversationId: r.conversationId,
      lastMessageAt: r.lastMessageAt,
      otherUser: otherByConversation.get(r.conversationId) ?? null,
    }));

    return { matchChats, directChats };
  }),
});

const tablesRouter = router({
  listPending: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: matches.id,
        code: matches.code,
        gameId: matches.gameId,
        state: matches.state,
        isPrivate: matches.isPrivate,
        maxPlayers: matches.maxPlayers,
        hostUserId: matches.hostUserId,
        createdAt: matches.createdAt,
      })
      .from(matches)
      .where(inArray(matches.state, ['waiting', 'starting']))
      .orderBy(desc(matches.createdAt));
  }),

  cancel: adminProcedure.input(z.object({ matchId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const [match] = await ctx.db.select({ state: matches.state }).from(matches).where(eq(matches.id, input.matchId)).limit(1);
    if (!match || (match.state !== 'waiting' && match.state !== 'starting')) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Esa mesa no está pendiente' });
    }
    await ctx.db.update(matches).set({ state: 'cancelled' }).where(eq(matches.id, input.matchId));
    await ctx.matchService.broadcastLobby(input.matchId);
    await logAdminAction(ctx.db, { adminUserId: ctx.user.id, action: 'tables.cancel', targetType: 'match', targetId: input.matchId });
    return { ok: true };
  }),
});

const reportsRouter = router({
  list: adminProcedure
    .input(z.object({ reviewedOnly: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.select().from(userReports).orderBy(desc(userReports.createdAt)).limit(200);
      const filtered = input?.reviewedOnly === false ? rows.filter((r) => !r.reviewedAt) : rows;

      const ids = [...new Set(filtered.flatMap((r) => [r.reporterId, r.reportedUserId]))];
      const lookup = await usersById(ctx.db, ids);

      return filtered.map((r) => ({
        ...r,
        reporter: lookup.get(r.reporterId) ?? null,
        reportedUser: lookup.get(r.reportedUserId) ?? null,
      }));
    }),

  markReviewed: adminProcedure.input(z.object({ reportId: z.uuid() })).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(userReports)
      .set({ reviewedAt: new Date(), reviewedByAdminId: ctx.user.id })
      .where(eq(userReports.id, input.reportId));
    await logAdminAction(ctx.db, {
      adminUserId: ctx.user.id,
      action: 'reports.markReviewed',
      targetType: 'user_report',
      targetId: input.reportId,
    });
    return { ok: true };
  }),
});

const matchChatRouter = router({
  get: adminProcedure.input(z.object({ matchId: z.uuid() })).query(async ({ ctx, input }) => {
    return ctx.db
      .select({
        id: matchChatMessages.id,
        userId: matchChatMessages.userId,
        username: users.username,
        body: matchChatMessages.body,
        createdAt: matchChatMessages.createdAt,
      })
      .from(matchChatMessages)
      .innerJoin(users, eq(matchChatMessages.userId, users.id))
      .where(eq(matchChatMessages.matchId, input.matchId))
      .orderBy(asc(matchChatMessages.createdAt));
  }),
});

const directChatRouter = router({
  get: adminProcedure.input(z.object({ conversationId: z.uuid() })).query(async ({ ctx, input }) => {
    return ctx.db
      .select({
        id: messages.id,
        userId: messages.userId,
        username: users.username,
        body: messages.body,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.conversationId, input.conversationId))
      .orderBy(asc(messages.createdAt));
  }),
});

const adminGamesRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        slug: games.id,
        name: games.name,
        categorySlug: games.categorySlug,
        categoryName: gameCategories.name,
        minPlayers: games.minPlayers,
        maxPlayers: games.maxPlayers,
        durationMin: games.durationMin,
        badge: games.badge,
        coverBg: games.coverBg,
        coverFg: games.coverFg,
        description: games.description,
        isActive: games.isActive,
      })
      .from(games)
      .leftJoin(gameCategories, eq(games.categorySlug, gameCategories.slug))
      .orderBy(asc(games.name));
  }),

  get: adminProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const [game] = await ctx.db.select().from(games).where(eq(games.id, input.slug)).limit(1);
    if (!game) throw new TRPCError({ code: 'NOT_FOUND' });
    const [content] = await ctx.db
      .select({ body: gameContent.body })
      .from(gameContent)
      .where(and(eq(gameContent.gameId, input.slug), eq(gameContent.sectionKey, 'rules')))
      .limit(1);
    return { ...game, rulesHtml: content?.body ?? '' };
  }),

  update: adminProcedure
    .input(
      z.object({
        slug: z.string(),
        name: z.string().trim().min(1).max(200),
        description: z.string().trim().max(2000).optional(),
        badge: z.string().trim().max(32).optional(),
        coverBg: z.string().trim().max(16).optional(),
        coverFg: z.string().trim().max(16).optional(),
        minPlayers: z.number().int().min(1).max(16),
        maxPlayers: z.number().int().min(1).max(16),
        durationMin: z.number().int().min(1).max(600).optional(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { slug, ...fields } = input;
      await ctx.db.update(games).set(fields).where(eq(games.id, slug));
      await logAdminAction(ctx.db, { adminUserId: ctx.user.id, action: 'games.update', targetType: 'game', targetId: slug, detail: fields });
      return { ok: true };
    }),

  updateRules: adminProcedure
    .input(z.object({ slug: z.string(), html: z.string().max(20_000) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(gameContent)
        .values({ gameId: input.slug, sectionKey: 'rules', body: input.html })
        .onConflictDoUpdate({
          target: [gameContent.gameId, gameContent.sectionKey],
          set: { body: input.html },
        });
      await logAdminAction(ctx.db, { adminUserId: ctx.user.id, action: 'games.updateRules', targetType: 'game', targetId: input.slug });
      return { ok: true };
    }),
});

const settingsRouter = router({
  get: adminProcedure.query(async ({ ctx }) => getMaintenanceStatus(ctx.db)),

  setMaintenance: adminProcedure
    .input(z.object({ enabled: z.boolean(), message: z.string().trim().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      return setMaintenanceStatus(ctx.db, { adminUserId: ctx.user.id, enabled: input.enabled, message: input.message ?? null });
    }),
});

const auditLogRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    const rows = await listAdminAuditLog(ctx.db);
    const ids = [...new Set(rows.map((r) => r.adminUserId))];
    const lookup = await usersById(ctx.db, ids);
    return rows.map((r) => ({ ...r, admin: lookup.get(r.adminUserId) ?? null }));
  }),
});

export const adminRouter = router({
  players: playersRouter,
  tables: tablesRouter,
  reports: reportsRouter,
  matchChat: matchChatRouter,
  directChat: directChatRouter,
  games: adminGamesRouter,
  settings: settingsRouter,
  auditLog: auditLogRouter,
});
