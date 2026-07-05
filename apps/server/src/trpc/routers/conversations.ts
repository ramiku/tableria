import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import * as conversations from '../../social/conversations.js';
import * as friends from '../../social/friends.js';
import { protectedProcedure, router } from '../trpc.js';

export const conversationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await conversations.listConversations(ctx.db, ctx.user.id);
    return rows.map((c) => ({
      ...c,
      lastMessage: c.lastMessage ? { ...c.lastMessage, createdAt: c.lastMessage.createdAt.toISOString() } : null,
    }));
  }),

  getOrCreateDirect: protectedProcedure.input(z.object({ friendId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const ok = await friends.areFriends(ctx.db, ctx.user.id, input.friendId);
    if (!ok) throw new TRPCError({ code: 'FORBIDDEN', message: 'Solo puedes escribir a tus amigos' });
    const conversationId = await conversations.getOrCreateDirect(ctx.db, ctx.user.id, input.friendId);
    return { conversationId };
  }),

  listMessages: protectedProcedure
    .input(z.object({ conversationId: z.uuid(), cursor: z.iso.datetime().optional() }))
    .query(async ({ ctx, input }) => {
      const member = await conversations.isMember(ctx.db, input.conversationId, ctx.user.id);
      if (!member) throw new TRPCError({ code: 'FORBIDDEN' });
      const rows = await conversations.listMessages(ctx.db, input.conversationId, input.cursor ? new Date(input.cursor) : undefined);
      return rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));
    }),

  markRead: protectedProcedure.input(z.object({ conversationId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const member = await conversations.isMember(ctx.db, input.conversationId, ctx.user.id);
    if (!member) throw new TRPCError({ code: 'FORBIDDEN' });
    await conversations.markRead(ctx.db, input.conversationId, ctx.user.id);
    return { ok: true };
  }),
});
