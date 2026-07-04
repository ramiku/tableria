import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { and, desc, eq, games, inArray, matchPlayers, matches, sql } from '@tableria/db';
import { insertWithUniqueCode } from '../../match/codes.js';
import { getGameDefinition } from '../../match/games.js';
import { protectedProcedure, publicProcedure, router } from '../trpc.js';

export const matchesRouter = router({
  listPublic: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        matchId: matches.id,
        code: matches.code,
        gameId: matches.gameId,
        gameName: games.name,
        maxPlayers: matches.maxPlayers,
      })
      .from(matches)
      .innerJoin(games, eq(matches.gameId, games.id))
      .where(and(eq(matches.isPrivate, false), eq(matches.state, 'waiting')))
      .orderBy(desc(matches.createdAt));

    if (rows.length === 0) return [];

    const counts = await ctx.db
      .select({ matchId: matchPlayers.matchId, n: sql<number>`count(*)::int` })
      .from(matchPlayers)
      .where(
        inArray(
          matchPlayers.matchId,
          rows.map((r) => r.matchId),
        ),
      )
      .groupBy(matchPlayers.matchId);
    const countMap = new Map(counts.map((c) => [c.matchId, c.n]));

    return rows.map((r) => ({ ...r, players: countMap.get(r.matchId) ?? 0 }));
  }),

  getByCode: protectedProcedure.input(z.object({ code: z.string().min(1) })).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select({ matchId: matches.id, gameId: matches.gameId, state: matches.state })
      .from(matches)
      .where(eq(matches.code, input.code.toUpperCase()))
      .limit(1);
    return row ?? null;
  }),

  create: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        isPrivate: z.boolean().default(false),
        turnDurationS: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [game] = await ctx.db.select().from(games).where(eq(games.id, input.gameId)).limit(1);
      if (!game || !game.isActive) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ese juego no está disponible todavía' });
      }

      const def = getGameDefinition(input.gameId);
      const options = (game.options ?? {}) as { defaultTurnSeconds?: number };
      const turnDurationS = input.turnDurationS ?? options.defaultTurnSeconds ?? def?.ui.defaultTurnSeconds ?? 30;
      const userId = ctx.user.id;

      return insertWithUniqueCode((code) =>
        ctx.db.transaction(async (tx) => {
          const [match] = await tx
            .insert(matches)
            .values({ code, gameId: game.id, hostUserId: userId, maxPlayers: game.maxPlayers, isPrivate: input.isPrivate, turnDurationS })
            .returning({ id: matches.id, code: matches.code });
          if (!match) throw new Error('No se pudo crear la sala');

          await tx.insert(matchPlayers).values({ matchId: match.id, userId, seat: 0 });
          return { matchId: match.id, code: match.code };
        }),
      );
    }),

  join: protectedProcedure.input(z.object({ code: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const result = await ctx.db.transaction(async (tx) => {
      const [match] = await tx
        .select()
        .from(matches)
        .where(eq(matches.code, input.code.toUpperCase()))
        .for('update');
      if (!match) throw new TRPCError({ code: 'NOT_FOUND', message: 'Ese código no corresponde a ninguna sala' });

      const [already] = await tx
        .select({ seat: matchPlayers.seat })
        .from(matchPlayers)
        .where(and(eq(matchPlayers.matchId, match.id), eq(matchPlayers.userId, userId)))
        .limit(1);
      if (already) return { matchId: match.id, seat: already.seat };

      if (match.state !== 'waiting') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'La sala ya no admite jugadores nuevos' });
      }

      const occupied = await tx
        .select({ seat: matchPlayers.seat })
        .from(matchPlayers)
        .where(eq(matchPlayers.matchId, match.id));
      if (occupied.length >= match.maxPlayers) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'La sala está completa' });
      }

      const occupiedSeats = new Set(occupied.map((o) => o.seat));
      let seat = 0;
      while (occupiedSeats.has(seat)) seat++;

      await tx.insert(matchPlayers).values({ matchId: match.id, userId, seat });
      return { matchId: match.id, seat };
    });

    await ctx.matchService.broadcastLobby(result.matchId);
    return result;
  }),

  setReady: protectedProcedure
    .input(z.object({ matchId: z.uuid(), ready: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const transition = await ctx.db.transaction(async (tx) => {
        const [match] = await tx.select().from(matches).where(eq(matches.id, input.matchId)).for('update');
        if (!match) throw new TRPCError({ code: 'NOT_FOUND' });

        await tx
          .update(matchPlayers)
          .set({ ready: input.ready })
          .where(and(eq(matchPlayers.matchId, input.matchId), eq(matchPlayers.userId, userId)));

        const players = await tx
          .select({ ready: matchPlayers.ready })
          .from(matchPlayers)
          .where(eq(matchPlayers.matchId, input.matchId));
        const allReady = players.length === match.maxPlayers && players.every((p) => p.ready);

        if (allReady && match.state === 'waiting') {
          await tx.update(matches).set({ state: 'starting' }).where(eq(matches.id, input.matchId));
          return 'start' as const;
        }
        if (!allReady && match.state === 'starting') {
          await tx.update(matches).set({ state: 'waiting' }).where(eq(matches.id, input.matchId));
          return 'cancel' as const;
        }
        return 'none' as const;
      });

      if (transition === 'start') await ctx.matchService.scheduleReadyCheck(input.matchId);
      else if (transition === 'cancel') await ctx.matchService.cancelReadyCheck(input.matchId);
      else await ctx.matchService.broadcastLobby(input.matchId);

      return { ok: true };
    }),

  leave: protectedProcedure.input(z.object({ matchId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const [match] = await ctx.db.select({ state: matches.state }).from(matches).where(eq(matches.id, input.matchId)).limit(1);
    if (!match || match.state !== 'waiting') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No puedes abandonar la sala ahora' });
    }
    await ctx.db
      .delete(matchPlayers)
      .where(and(eq(matchPlayers.matchId, input.matchId), eq(matchPlayers.userId, ctx.user.id)));
    await ctx.matchService.broadcastLobby(input.matchId);
    return { ok: true };
  }),
});
