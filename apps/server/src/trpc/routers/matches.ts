import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { and, desc, eq, games, inArray, matchPlayers, matches, sql, users } from '@tableria/db';
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
        rated: matches.rated,
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

  /** Últimas partidas acabadas del usuario, con rival(es) y resultado — para el perfil. */
  recent: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        matchId: matches.id,
        gameId: matches.gameId,
        gameName: games.name,
        finishedAt: matches.finishedAt,
        rated: matches.rated,
        mySeat: matchPlayers.seat,
        myPlacement: matchPlayers.placement,
        myRatingBefore: matchPlayers.ratingBefore,
        myRatingAfter: matchPlayers.ratingAfter,
      })
      .from(matchPlayers)
      .innerJoin(matches, eq(matches.id, matchPlayers.matchId))
      .innerJoin(games, eq(games.id, matches.gameId))
      .where(and(eq(matchPlayers.userId, ctx.user.id), eq(matches.state, 'finished')))
      .orderBy(desc(matches.finishedAt))
      .limit(10);

    if (rows.length === 0) return [];

    const opponents = await ctx.db
      .select({
        matchId: matchPlayers.matchId,
        seat: matchPlayers.seat,
        placement: matchPlayers.placement,
        username: users.username,
        avatarInitial: users.avatarInitial,
        avatarColor: users.avatarColor,
      })
      .from(matchPlayers)
      .innerJoin(users, eq(users.id, matchPlayers.userId))
      .where(
        inArray(
          matchPlayers.matchId,
          rows.map((r) => r.matchId),
        ),
      );

    return rows.map((r) => {
      const others = opponents.filter((o) => o.matchId === r.matchId && o.seat !== r.mySeat);
      const minOtherPlacement = Math.min(...others.map((o) => o.placement ?? Number.MAX_SAFE_INTEGER));
      const result: 'win' | 'lose' | 'draw' =
        r.myPlacement !== minOtherPlacement ? (r.myPlacement! < minOtherPlacement ? 'win' : 'lose') : 'draw';

      return {
        matchId: r.matchId,
        gameId: r.gameId,
        gameName: r.gameName,
        finishedAt: r.finishedAt?.toISOString() ?? null,
        rated: r.rated,
        ratingDelta:
          r.rated && r.myRatingBefore != null && r.myRatingAfter != null
            ? Math.round(r.myRatingAfter - r.myRatingBefore)
            : null,
        result,
        opponents: others.map((o) => ({
          username: o.username,
          avatarInitial: o.avatarInitial,
          avatarColor: o.avatarColor,
        })),
      };
    });
  }),

  /** Mesa activa del usuario (esperando, arrancando o en juego) — el lobby de cada juego decide su estado con esto. */
  myActive: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({ matchId: matches.id, code: matches.code, gameId: matches.gameId, state: matches.state })
      .from(matchPlayers)
      .innerJoin(matches, eq(matches.id, matchPlayers.matchId))
      .where(and(eq(matchPlayers.userId, ctx.user.id), inArray(matches.state, ['waiting', 'starting', 'in_game'])))
      .limit(1);
    return row ?? null;
  }),

  /** Mesas públicas en espera de un juego, con sus asientos — para unirse pulsando el círculo libre. */
  listWaiting: protectedProcedure.input(z.object({ gameId: z.string() })).query(async ({ ctx, input }) => {
    const rows = await ctx.db
      .select({
        matchId: matches.id,
        code: matches.code,
        mode: matches.mode,
        turnDurationS: matches.turnDurationS,
        options: matches.options,
        maxPlayers: matches.maxPlayers,
        rated: matches.rated,
      })
      .from(matches)
      .where(and(eq(matches.gameId, input.gameId), eq(matches.state, 'waiting'), eq(matches.isPrivate, false)))
      .orderBy(desc(matches.createdAt))
      .limit(12);

    if (rows.length === 0) return [];

    const players = await ctx.db
      .select({
        matchId: matchPlayers.matchId,
        seat: matchPlayers.seat,
        userId: matchPlayers.userId,
        username: users.username,
        avatarInitial: users.avatarInitial,
        avatarColor: users.avatarColor,
      })
      .from(matchPlayers)
      .innerJoin(users, eq(users.id, matchPlayers.userId))
      .where(
        inArray(
          matchPlayers.matchId,
          rows.map((r) => r.matchId),
        ),
      );

    return rows.map((r) => ({
      ...r,
      variant: ((r.options as { variant?: string } | null)?.variant ?? null) as string | null,
      seats: players.filter((p) => p.matchId === r.matchId).sort((a, b) => a.seat - b.seat),
    }));
  }),

  /** Solo lo mínimo para que la página de partida sepa qué tablero renderizar. */
  getById: protectedProcedure.input(z.object({ matchId: z.uuid() })).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select({ gameId: matches.gameId })
      .from(matches)
      .where(eq(matches.id, input.matchId))
      .limit(1);
    return row ?? null;
  }),

  getByCode: protectedProcedure.input(z.object({ code: z.string().min(1) })).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select({
        matchId: matches.id,
        gameId: matches.gameId,
        state: matches.state,
        mode: matches.mode,
        isPrivate: matches.isPrivate,
        turnDurationS: matches.turnDurationS,
        options: matches.options,
        rated: matches.rated,
      })
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
        mode: z.enum(['realtime', 'async']).default('realtime'),
        turnDurationS: z.number().int().positive().optional(),
        variant: z.string().optional(),
        rated: z.boolean().default(false),
        /** Solo tiene efecto en juegos de aforo variable (minPlayers !== maxPlayers, p.ej. Pista Única); se ignora en el resto. */
        numPlayers: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [game] = await ctx.db.select().from(games).where(eq(games.id, input.gameId)).limit(1);
      if (!game || !game.isActive) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ese juego no está disponible todavía' });
      }

      let maxPlayers = game.maxPlayers;
      if (input.numPlayers != null) {
        if (input.numPlayers < game.minPlayers || input.numPlayers > game.maxPlayers) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Este juego admite entre ${game.minPlayers} y ${game.maxPlayers} jugadores` });
        }
        maxPlayers = input.numPlayers;
      }

      const def = getGameDefinition(input.gameId);
      const catalogOptions = (game.options ?? {}) as { defaultTurnSeconds?: number };
      const turnDurationS = input.turnDurationS ?? catalogOptions.defaultTurnSeconds ?? def?.ui.defaultTurnSeconds ?? 30;
      const userId = ctx.user.id;

      const availableVariants = def?.ui.variants ?? [];
      if (input.variant && availableVariants.length > 0 && !availableVariants.some((v) => v.id === input.variant)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Esa variante no existe para este juego' });
      }
      const matchOptions = input.variant ? { variant: input.variant } : null;

      // Ya está sentado en otra mesa activa: se le devuelve esa misma mesa en vez de
      // crear una nueva (evita acumular mesas huérfanas del mismo anfitrión).
      const [active] = await ctx.db
        .select({ matchId: matches.id, code: matches.code })
        .from(matchPlayers)
        .innerJoin(matches, eq(matches.id, matchPlayers.matchId))
        .where(and(eq(matchPlayers.userId, userId), inArray(matches.state, ['waiting', 'starting', 'in_game'])))
        .limit(1);
      if (active) return active;

      return insertWithUniqueCode((code) =>
        ctx.db.transaction(async (tx) => {
          const [match] = await tx
            .insert(matches)
            .values({
              code,
              gameId: game.id,
              hostUserId: userId,
              maxPlayers,
              isPrivate: input.isPrivate,
              mode: input.mode,
              turnDurationS,
              options: matchOptions,
              rated: input.rated,
            })
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

      // Misma regla que en create: una sola mesa activa por usuario.
      const [otherActive] = await tx
        .select({ matchId: matchPlayers.matchId })
        .from(matchPlayers)
        .innerJoin(matches, eq(matches.id, matchPlayers.matchId))
        .where(and(eq(matchPlayers.userId, userId), inArray(matches.state, ['waiting', 'starting', 'in_game'])))
        .limit(1);
      if (otherActive) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ya estás sentado en otra mesa. Abandónala antes de unirte a una nueva.' });
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

      // Arranque instantáneo: en cuanto el último jugador confirma, la partida empieza
      // en ese mismo momento (decisión de producto — sin cuenta atrás de cortesía).
      if (transition === 'start') await ctx.matchService.startNow(input.matchId);
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
