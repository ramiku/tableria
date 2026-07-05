import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  and,
  asc,
  desc,
  eq,
  games,
  inArray,
  tournamentMatches,
  tournamentParticipants,
  tournamentRounds,
  tournaments,
  users,
} from '@tableria/db';
import { protectedProcedure, publicProcedure, router } from '../trpc.js';

export const tournamentsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        state: tournaments.state,
        format: tournaments.format,
        gameId: tournaments.gameId,
        gameName: games.name,
        rated: tournaments.rated,
        createdAt: tournaments.createdAt,
        startedAt: tournaments.startedAt,
        finishedAt: tournaments.finishedAt,
      })
      .from(tournaments)
      .innerJoin(games, eq(games.id, tournaments.gameId))
      .orderBy(desc(tournaments.createdAt));

    if (rows.length === 0) return [];

    const counts = await ctx.db
      .select({ tournamentId: tournamentParticipants.tournamentId })
      .from(tournamentParticipants)
      .where(
        inArray(
          tournamentParticipants.tournamentId,
          rows.map((r) => r.id),
        ),
      );
    const countByTournament = new Map<string, number>();
    for (const c of counts) countByTournament.set(c.tournamentId, (countByTournament.get(c.tournamentId) ?? 0) + 1);

    return rows.map((r) => ({ ...r, participantCount: countByTournament.get(r.id) ?? 0 }));
  }),

  getById: publicProcedure.input(z.object({ tournamentId: z.uuid() })).query(async ({ ctx, input }) => {
    const [t] = await ctx.db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        state: tournaments.state,
        format: tournaments.format,
        gameId: tournaments.gameId,
        gameName: games.name,
        hostUserId: tournaments.hostUserId,
        rated: tournaments.rated,
        totalRounds: tournaments.totalRounds,
        createdAt: tournaments.createdAt,
        startedAt: tournaments.startedAt,
        finishedAt: tournaments.finishedAt,
      })
      .from(tournaments)
      .innerJoin(games, eq(games.id, tournaments.gameId))
      .where(eq(tournaments.id, input.tournamentId))
      .limit(1);
    if (!t) return null;

    const participants = await ctx.db
      .select({
        userId: tournamentParticipants.userId,
        status: tournamentParticipants.status,
        seed: tournamentParticipants.seed,
        finalPlacement: tournamentParticipants.finalPlacement,
        points: tournamentParticipants.points,
        username: users.username,
        avatarInitial: users.avatarInitial,
        avatarColor: users.avatarColor,
      })
      .from(tournamentParticipants)
      .innerJoin(users, eq(users.id, tournamentParticipants.userId))
      .where(eq(tournamentParticipants.tournamentId, input.tournamentId))
      .orderBy(asc(tournamentParticipants.joinedAt));
    const participantByUserId = new Map(participants.map((p) => [p.userId, p]));

    const rounds = await ctx.db
      .select()
      .from(tournamentRounds)
      .where(eq(tournamentRounds.tournamentId, input.tournamentId))
      .orderBy(asc(tournamentRounds.roundNumber));

    const roundIds = rounds.map((r) => r.id);
    const tmatches = roundIds.length
      ? await ctx.db
          .select()
          .from(tournamentMatches)
          .where(inArray(tournamentMatches.roundId, roundIds))
          .orderBy(asc(tournamentMatches.slotIndex))
      : [];

    const roundsWithMatches = rounds.map((r) => ({
      ...r,
      matches: tmatches
        .filter((m) => m.roundId === r.id)
        .map((m) => ({
          ...m,
          participantA: m.participantAId ? (participantByUserId.get(m.participantAId) ?? null) : null,
          participantB: m.participantBId ? (participantByUserId.get(m.participantBId) ?? null) : null,
        })),
    }));

    return { tournament: t, participants, rounds: roundsWithMatches };
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(80),
        gameId: z.string(),
        format: z.enum(['single_elim', 'swiss']).default('single_elim'),
        turnDurationS: z.number().int().positive().optional(),
        rated: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [game] = await ctx.db.select().from(games).where(eq(games.id, input.gameId)).limit(1);
      if (!game || !game.isActive) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ese juego no está disponible todavía' });
      }

      const [t] = await ctx.db
        .insert(tournaments)
        .values({
          name: input.name,
          gameId: input.gameId,
          format: input.format,
          hostUserId: ctx.user.id,
          rated: input.rated,
          turnDurationS: input.turnDurationS,
        })
        .returning({ id: tournaments.id });
      if (!t) throw new Error('No se pudo crear el torneo');

      // El organizador también puede jugar: se inscribe como cualquier otro participante.
      await ctx.db.insert(tournamentParticipants).values({ tournamentId: t.id, userId: ctx.user.id });

      return { tournamentId: t.id };
    }),

  register: protectedProcedure.input(z.object({ tournamentId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const [t] = await ctx.db.select({ state: tournaments.state }).from(tournaments).where(eq(tournaments.id, input.tournamentId)).limit(1);
    if (!t) throw new TRPCError({ code: 'NOT_FOUND' });
    if (t.state !== 'registration') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Este torneo ya no admite inscripciones' });
    }
    await ctx.db
      .insert(tournamentParticipants)
      .values({ tournamentId: input.tournamentId, userId: ctx.user.id })
      .onConflictDoNothing();
    return { ok: true };
  }),

  unregister: protectedProcedure.input(z.object({ tournamentId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const [t] = await ctx.db.select({ state: tournaments.state }).from(tournaments).where(eq(tournaments.id, input.tournamentId)).limit(1);
    if (!t) throw new TRPCError({ code: 'NOT_FOUND' });
    if (t.state !== 'registration') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'El torneo ya ha empezado' });
    }
    await ctx.db
      .delete(tournamentParticipants)
      .where(and(eq(tournamentParticipants.tournamentId, input.tournamentId), eq(tournamentParticipants.userId, ctx.user.id)));
    return { ok: true };
  }),

  checkIn: protectedProcedure
    .input(z.object({ tournamentId: z.uuid(), checkedIn: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [t] = await ctx.db.select({ state: tournaments.state }).from(tournaments).where(eq(tournaments.id, input.tournamentId)).limit(1);
      if (!t) throw new TRPCError({ code: 'NOT_FOUND' });
      if (t.state !== 'registration') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'El torneo ya ha empezado' });
      }
      const result = await ctx.db
        .update(tournamentParticipants)
        .set({ status: input.checkedIn ? 'checked_in' : 'registered' })
        .where(and(eq(tournamentParticipants.tournamentId, input.tournamentId), eq(tournamentParticipants.userId, ctx.user.id)))
        .returning({ userId: tournamentParticipants.userId });
      if (result.length === 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No estás inscrito en este torneo' });
      return { ok: true };
    }),

  start: protectedProcedure.input(z.object({ tournamentId: z.uuid() })).mutation(async ({ ctx, input }) => {
    try {
      await ctx.tournamentService.startTournament(input.tournamentId, ctx.user.id);
    } catch (err) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: err instanceof Error ? err.message : 'No se pudo iniciar el torneo' });
    }
    return { ok: true };
  }),

  cancel: protectedProcedure.input(z.object({ tournamentId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const [t] = await ctx.db.select().from(tournaments).where(eq(tournaments.id, input.tournamentId)).limit(1);
    if (!t) throw new TRPCError({ code: 'NOT_FOUND' });
    if (t.hostUserId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
    if (t.state === 'finished' || t.state === 'cancelled') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'El torneo ya ha terminado' });
    }
    await ctx.db.update(tournaments).set({ state: 'cancelled' }).where(eq(tournaments.id, input.tournamentId));
    return { ok: true };
  }),
});
