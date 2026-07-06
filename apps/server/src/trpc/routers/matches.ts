import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { and, desc, eq, games, inArray, matchPlayers, matches, ne, sql, users } from '@tableria/db';
import { insertWithUniqueCode } from '../../match/codes.js';
import { getGameDefinition } from '../../match/games.js';
import { loadEngineState } from '../../match/persistence.js';
import { listFriendIds } from '../../social/friends.js';
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

    // Ni vacías (mesa huérfana de antes de que abandonar como anfitrión cancelara la mesa entera)
    // ni llenas (a punto de arrancar, ya no admiten más jugadores): solo mesas a las que unirse.
    return rows
      .map((r) => ({ ...r, players: countMap.get(r.matchId) ?? 0 }))
      .filter((r) => r.players > 0 && r.players < r.maxPlayers);
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
      .select({
        matchId: matches.id,
        code: matches.code,
        gameId: matches.gameId,
        state: matches.state,
        mode: matches.mode,
        turnDurationS: matches.turnDurationS,
        rated: matches.rated,
        isPrivate: matches.isPrivate,
        maxPlayers: matches.maxPlayers,
        options: matches.options,
      })
      .from(matchPlayers)
      .innerJoin(matches, eq(matches.id, matchPlayers.matchId))
      .where(and(eq(matchPlayers.userId, ctx.user.id), inArray(matches.state, ['waiting', 'starting', 'in_game'])))
      .limit(1);
    if (!row) return null;
    const { options, ...rest } = row;
    return { ...rest, variant: ((options as { variant?: string } | null)?.variant ?? null) as string | null };
  }),

  /**
   * Partida por turnos (async) del usuario donde ahora mismo le toca mover — para el banner
   * "Continúa donde lo dejaste" de Explorar. En tiempo real no aplica (ver `notifyTurnIfAsync`
   * en `match/lifecycle.ts`: ahí ambos jugadores ya están delante del tablero, no hace falta
   * avisar). No depende de que la partida tenga runtime cargado en memoria — reconstruye el
   * estado autoritativo igual que `loadEngineState` ya hace para la reconexión/recuperación.
   */
  myTurn: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({
        matchId: matches.id,
        gameId: matches.gameId,
        gameName: games.name,
        mySeat: matchPlayers.seat,
        turnDeadlineAt: matches.turnDeadlineAt,
      })
      .from(matchPlayers)
      .innerJoin(matches, eq(matches.id, matchPlayers.matchId))
      .innerJoin(games, eq(games.id, matches.gameId))
      .where(and(eq(matchPlayers.userId, ctx.user.id), eq(matches.mode, 'async'), eq(matches.state, 'in_game')))
      .limit(1);
    if (!row) return null;

    const def = getGameDefinition(row.gameId);
    if (!def) return null;
    const loaded = await loadEngineState(ctx.db, def, row.matchId);
    if (!loaded) return null;
    if (!def.activePlayers(loaded.state).includes(row.mySeat)) return null;

    const opponents = await ctx.db
      .select({ displayName: users.displayName })
      .from(matchPlayers)
      .innerJoin(users, eq(users.id, matchPlayers.userId))
      .where(and(eq(matchPlayers.matchId, row.matchId), ne(matchPlayers.seat, row.mySeat)));

    return {
      matchId: row.matchId,
      gameId: row.gameId,
      gameName: row.gameName,
      opponentNames: opponents.map((o) => o.displayName),
      turnDeadlineAt: row.turnDeadlineAt?.toISOString() ?? null,
    };
  }),

  /**
   * Mesas en espera creadas por un amigo (aunque sean privadas — la visibilidad aquí la da la
   * amistad, no `isPrivate`) — para "Salas de amigos" en el rail: unirse en un clic desde ahí.
   */
  friendsWaiting: protectedProcedure.query(async ({ ctx }) => {
    const friendIds = await listFriendIds(ctx.db, ctx.user.id);
    if (friendIds.length === 0) return [];

    const rows = await ctx.db
      .select({
        matchId: matches.id,
        code: matches.code,
        gameId: matches.gameId,
        gameName: games.name,
        maxPlayers: matches.maxPlayers,
        hostDisplayName: users.displayName,
        hostAvatarInitial: users.avatarInitial,
        hostAvatarColor: users.avatarColor,
      })
      .from(matches)
      .innerJoin(games, eq(matches.gameId, games.id))
      .innerJoin(users, eq(users.id, matches.hostUserId))
      .where(and(eq(matches.state, 'waiting'), inArray(matches.hostUserId, friendIds)))
      .orderBy(desc(matches.createdAt))
      .limit(20);

    if (rows.length === 0) return [];

    const seatRows = await ctx.db
      .select({ matchId: matchPlayers.matchId, userId: matchPlayers.userId })
      .from(matchPlayers)
      .where(
        inArray(
          matchPlayers.matchId,
          rows.map((r) => r.matchId),
        ),
      );
    const seatsByMatch = new Map<string, string[]>();
    for (const s of seatRows) {
      const list = seatsByMatch.get(s.matchId) ?? [];
      list.push(s.userId);
      seatsByMatch.set(s.matchId, list);
    }

    // Ya llena o ya sentado en ella (p.ej. la creó otro amigo dentro de la misma mesa): no es "unirse".
    return rows
      .map((r) => ({ ...r, seats: seatsByMatch.get(r.matchId) ?? [] }))
      .filter((r) => r.seats.length < r.maxPlayers && !r.seats.includes(ctx.user.id))
      .map(({ seats: _seats, ...r }) => r);
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

  /** Lo mínimo para que la página de partida sepa qué tablero renderizar y cómo etiquetar su chat de voz. */
  getById: protectedProcedure.input(z.object({ matchId: z.uuid() })).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select({ gameId: matches.gameId, gameName: games.name })
      .from(matches)
      .innerJoin(games, eq(matches.gameId, games.id))
      .where(eq(matches.id, input.matchId))
      .limit(1);
    return row ?? null;
  }),

  getByCode: protectedProcedure.input(z.object({ code: z.string().min(1) })).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select({
        matchId: matches.id,
        gameId: matches.gameId,
        gameName: games.name,
        state: matches.state,
        mode: matches.mode,
        isPrivate: matches.isPrivate,
        turnDurationS: matches.turnDurationS,
        options: matches.options,
        rated: matches.rated,
      })
      .from(matches)
      .innerJoin(games, eq(matches.gameId, games.id))
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
        /** null explícito = "sin tiempo" (amistosa, sin forfeit por reloj); ausente = usar el default del juego. */
        turnDurationS: z.number().int().positive().nullable().optional(),
        variant: z.string().optional(),
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
      // "Sin tiempo" (input.turnDurationS === null) siempre es amistosa; cualquier partida con
      // reloj de turno es competitiva — ya no es una elección aparte del anfitrión.
      const untimed = input.turnDurationS === null;
      const turnDurationS = untimed
        ? null
        : (input.turnDurationS ?? catalogOptions.defaultTurnSeconds ?? def?.ui.defaultTurnSeconds ?? 30);
      const rated = !untimed;
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
              rated,
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
    const [match] = await ctx.db
      .select({ state: matches.state, hostUserId: matches.hostUserId })
      .from(matches)
      .where(eq(matches.id, input.matchId))
      .limit(1);
    if (!match || match.state !== 'waiting') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'No puedes abandonar la sala ahora' });
    }

    if (match.hostUserId === ctx.user.id) {
      // El anfitrión se va: se cierra la mesa entera para todos, no solo su asiento.
      await ctx.db.update(matches).set({ state: 'cancelled' }).where(eq(matches.id, input.matchId));
    } else {
      await ctx.db
        .delete(matchPlayers)
        .where(and(eq(matchPlayers.matchId, input.matchId), eq(matchPlayers.userId, ctx.user.id)));
    }
    await ctx.matchService.broadcastLobby(input.matchId);
    return { ok: true };
  }),
});
