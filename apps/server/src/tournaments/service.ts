import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  matchPlayers,
  matches,
  seasons,
  tournamentMatches,
  tournamentParticipants,
  tournamentRounds,
  tournaments,
  userGameRatings,
  type Db,
} from '@tableria/db';
import { insertWithUniqueCode } from '../match/codes.js';
import { onMatchFinished } from '../match/events.js';
import type { MatchService } from '../match/service.js';
import * as notifications from '../social/notifications.js';
import { socketsFor } from '../social/presence.js';
import { sendToSocket } from '../ws/send.js';
import { assignBracket, nextPowerOfTwo, placementForEliminationRound, totalRoundsForSize } from './bracket.js';
import { pairKey, pairSwissRound, pointsForResult, swissRoundsForSize, type SwissStanding } from './swiss.js';

const DEFAULT_RATING = 1500;

export interface TournamentService {
  startTournament(tournamentId: string, requestingUserId: string): Promise<void>;
  recoverOnBoot(): Promise<void>;
}

export function createTournamentService(db: Db, matchService: MatchService): TournamentService {
  async function notify(userId: string, type: notifications.NotificationType, payload: unknown): Promise<void> {
    const row = await notifications.create(db, userId, type, payload);
    for (const socket of socketsFor(userId)) {
      sendToSocket(socket, {
        type: 'notification.new',
        payload: { id: row.id, type: row.type, payload: row.payload, createdAt: row.createdAt.toISOString() },
      });
    }
  }

  async function ratingsForUsers(gameId: string, userIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (userIds.length === 0) return map;
    const [season] = await db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
    if (!season) return map;
    const rows = await db
      .select({ userId: userGameRatings.userId, rating: userGameRatings.rating })
      .from(userGameRatings)
      .where(
        and(
          eq(userGameRatings.gameId, gameId),
          eq(userGameRatings.seasonId, season.id),
          inArray(userGameRatings.userId, userIds),
        ),
      );
    for (const r of rows) map.set(r.userId, r.rating);
    return map;
  }

  /**
   * Crea una ronda: una fila `tournamentMatches` por pareja (con la partida real
   * ya creada y arrancada) o, si uno de los dos huecos está vacío, un bye ya
   * resuelto sin crear partida. `slots` ya viene en el orden correcto (de
   * `assignBracket`/`pairSwissRound` en la ronda 1, o de los ganadores/parejas de
   * la ronda anterior en las siguientes). Formato-agnóstico: ni sabe ni le
   * importa si el torneo es de eliminación o suizo, solo instancia parejas.
   */
  async function generateRound(
    tournamentId: string,
    gameId: string,
    turnDurationS: number,
    rated: boolean,
    roundNumber: number,
    slots: (string | null)[],
  ): Promise<string> {
    const [round] = await db.insert(tournamentRounds).values({ tournamentId, roundNumber }).returning({ id: tournamentRounds.id });
    const roundId = round!.id;
    const startedMatchIds: string[] = [];

    for (let i = 0; i < slots.length; i += 2) {
      const a = slots[i] ?? null;
      const b = slots[i + 1] ?? null;
      const slotIndex = i / 2;

      if (!a || !b) {
        const winner = a ?? b;
        await db.insert(tournamentMatches).values({
          tournamentId,
          roundId,
          slotIndex,
          participantAId: a,
          participantBId: b,
          winnerUserId: winner,
          state: 'finished',
        });
        continue;
      }

      const matchId = await insertWithUniqueCode((code) =>
        db.transaction(async (tx) => {
          const [match] = await tx
            .insert(matches)
            .values({ code, gameId, hostUserId: a, maxPlayers: 2, isPrivate: true, mode: 'realtime', turnDurationS, rated })
            .returning({ id: matches.id });
          await tx.insert(matchPlayers).values([
            { matchId: match!.id, userId: a, seat: 0 },
            { matchId: match!.id, userId: b, seat: 1 },
          ]);
          await tx.insert(tournamentMatches).values({
            tournamentId,
            roundId,
            slotIndex,
            participantAId: a,
            participantBId: b,
            matchId: match!.id,
            state: 'pending',
          });
          return match!.id;
        }),
      );
      startedMatchIds.push(matchId);

      await notify(a, 'tournament_round_started', { tournamentId, matchId });
      await notify(b, 'tournament_round_started', { tournamentId, matchId });
    }

    for (const matchId of startedMatchIds) await matchService.startNow(matchId);
    return roundId;
  }

  /** Solo para suizo: un bye vale 1 punto igual que una victoria, sin necesidad de jugarlo. */
  async function awardByePoints(tournamentId: string, roundId: string): Promise<void> {
    const byes = await db
      .select({ userId: tournamentMatches.participantAId })
      .from(tournamentMatches)
      .where(and(eq(tournamentMatches.roundId, roundId), isNull(tournamentMatches.participantBId)));
    for (const bye of byes) {
      if (!bye.userId) continue;
      await addPoints(tournamentId, bye.userId, 1);
    }
  }

  async function addPoints(tournamentId: string, userId: string, delta: number): Promise<void> {
    const [row] = await db
      .select({ points: tournamentParticipants.points })
      .from(tournamentParticipants)
      .where(and(eq(tournamentParticipants.tournamentId, tournamentId), eq(tournamentParticipants.userId, userId)))
      .limit(1);
    await db
      .update(tournamentParticipants)
      .set({ points: (row?.points ?? 0) + delta })
      .where(and(eq(tournamentParticipants.tournamentId, tournamentId), eq(tournamentParticipants.userId, userId)));
  }

  /** Todas las parejas que YA se han jugado (excluye byes: descansar no cuenta como enfrentamiento). */
  async function playedPairsForTournament(tournamentId: string): Promise<Set<string>> {
    const rows = await db
      .select({ a: tournamentMatches.participantAId, b: tournamentMatches.participantBId })
      .from(tournamentMatches)
      .where(eq(tournamentMatches.tournamentId, tournamentId));
    const set = new Set<string>();
    for (const r of rows) if (r.a && r.b) set.add(pairKey(r.a, r.b));
    return set;
  }

  /** Quién ya ha descansado alguna ronda (para no hacer descansar dos veces a la misma persona antes que al resto). */
  async function byeRecipientsForTournament(tournamentId: string): Promise<Set<string>> {
    const rows = await db
      .select({ userId: tournamentMatches.participantAId })
      .from(tournamentMatches)
      .where(and(eq(tournamentMatches.tournamentId, tournamentId), isNull(tournamentMatches.participantBId)));
    return new Set(rows.map((r) => r.userId!));
  }

  async function finishEliminationTournament(tournamentId: string, championUserId: string): Promise<void> {
    await db
      .update(tournamentParticipants)
      .set({ finalPlacement: 1 })
      .where(and(eq(tournamentParticipants.tournamentId, tournamentId), eq(tournamentParticipants.userId, championUserId)));
    await db.update(tournaments).set({ state: 'finished', finishedAt: new Date() }).where(eq(tournaments.id, tournamentId));
  }

  /** Cierra un torneo suizo: clasificación final por puntos desc (empates comparten puesto, desempate estable por seed). */
  async function finishSwissTournament(tournamentId: string): Promise<void> {
    const rows = await db
      .select({ userId: tournamentParticipants.userId, points: tournamentParticipants.points, seed: tournamentParticipants.seed })
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId));
    const sorted = [...rows].sort((x, y) => y.points - x.points || (x.seed ?? 0) - (y.seed ?? 0));

    let placement = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i]!.points < sorted[i - 1]!.points) placement = i + 1;
      await db
        .update(tournamentParticipants)
        .set({ finalPlacement: placement })
        .where(and(eq(tournamentParticipants.tournamentId, tournamentId), eq(tournamentParticipants.userId, sorted[i]!.userId)));
    }
    await db.update(tournaments).set({ state: 'finished', finishedAt: new Date() }).where(eq(tournaments.id, tournamentId));
  }

  /**
   * Avanza una ronda de ELIMINACIÓN completamente resuelta (todas sus
   * `tournamentMatches` en `finished`): junta los ganadores en orden de
   * `slotIndex` y genera la siguiente ronda, o cierra el torneo si solo
   * quedaba una partida.
   */
  async function advanceEliminationRound(
    tournamentId: string,
    gameId: string,
    turnDurationS: number,
    rated: boolean,
    roundId: string,
    roundNumber: number,
  ): Promise<void> {
    const roundMatches = await db.select().from(tournamentMatches).where(eq(tournamentMatches.roundId, roundId));
    if (roundMatches.length === 0 || roundMatches.some((m) => m.state !== 'finished')) return;

    const winners = [...roundMatches].sort((x, y) => x.slotIndex - y.slotIndex).map((m) => m.winnerUserId!);

    if (winners.length === 1) {
      await finishEliminationTournament(tournamentId, winners[0]!);
      return;
    }

    await generateRound(tournamentId, gameId, turnDurationS, rated, roundNumber + 1, winners);
  }

  /**
   * Avanza una ronda SUIZA completamente resuelta: si ya se jugaron todas las
   * rondas del torneo, cierra y calcula la clasificación final por puntos; si
   * no, reempareja según la puntuación acumulada (evitando revanchas cuando
   * es posible) y genera la siguiente ronda.
   */
  async function advanceSwissRound(
    tournamentId: string,
    gameId: string,
    turnDurationS: number,
    rated: boolean,
    roundId: string,
    roundNumber: number,
    totalRounds: number,
  ): Promise<void> {
    const roundMatches = await db.select().from(tournamentMatches).where(eq(tournamentMatches.roundId, roundId));
    if (roundMatches.length === 0 || roundMatches.some((m) => m.state !== 'finished')) return;

    if (roundNumber >= totalRounds) {
      await finishSwissTournament(tournamentId);
      return;
    }

    const participants = await db
      .select({ userId: tournamentParticipants.userId, points: tournamentParticipants.points, seed: tournamentParticipants.seed })
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId));
    const standings: SwissStanding[] = participants.map((p) => ({ id: p.userId, points: p.points, seed: p.seed ?? 0 }));

    const playedPairs = await playedPairsForTournament(tournamentId);
    const alreadyHadBye = await byeRecipientsForTournament(tournamentId);
    const slots = pairSwissRound(standings, playedPairs, alreadyHadBye);

    const newRoundId = await generateRound(tournamentId, gameId, turnDurationS, rated, roundNumber + 1, slots);
    await awardByePoints(tournamentId, newRoundId);
  }

  async function onEliminationMatchFinished(
    tournament: typeof tournaments.$inferSelect,
    tm: typeof tournamentMatches.$inferSelect,
  ): Promise<void> {
    const players = await db
      .select({ userId: matchPlayers.userId, placement: matchPlayers.placement })
      .from(matchPlayers)
      .where(eq(matchPlayers.matchId, tm.matchId!));
    const placementByUser = new Map(players.map((p) => [p.userId, p.placement ?? Number.MAX_SAFE_INTEGER]));

    const a = tm.participantAId!;
    const b = tm.participantBId!;
    let winnerUserId: string;
    if (placementByUser.get(a)! < placementByUser.get(b)!) {
      winnerUserId = a;
    } else if (placementByUser.get(b)! < placementByUser.get(a)!) {
      winnerUserId = b;
    } else {
      // Empate: gana el mejor sembrado (seed más bajo) — sin revancha ni desempate a mejor-de-3.
      const seeds = await db
        .select({ userId: tournamentParticipants.userId, seed: tournamentParticipants.seed })
        .from(tournamentParticipants)
        .where(and(eq(tournamentParticipants.tournamentId, tm.tournamentId), inArray(tournamentParticipants.userId, [a, b])));
      const seedA = seeds.find((s) => s.userId === a)?.seed ?? Number.MAX_SAFE_INTEGER;
      const seedB = seeds.find((s) => s.userId === b)?.seed ?? Number.MAX_SAFE_INTEGER;
      winnerUserId = seedA <= seedB ? a : b;
    }
    const loserUserId = winnerUserId === a ? b : a;

    await db.update(tournamentMatches).set({ winnerUserId, state: 'finished' }).where(eq(tournamentMatches.id, tm.id));

    const [round] = await db.select().from(tournamentRounds).where(eq(tournamentRounds.id, tm.roundId)).limit(1);
    const placement = placementForEliminationRound(round!.roundNumber, tournament.totalRounds!);
    await db
      .update(tournamentParticipants)
      .set({ status: 'eliminated', finalPlacement: placement })
      .where(and(eq(tournamentParticipants.tournamentId, tm.tournamentId), eq(tournamentParticipants.userId, loserUserId)));
    await notify(loserUserId, 'tournament_eliminated', { tournamentId: tm.tournamentId, placement });

    await advanceEliminationRound(
      tm.tournamentId,
      tournament.gameId,
      tournament.turnDurationS ?? 30,
      tournament.rated,
      tm.roundId,
      round!.roundNumber,
    );
  }

  /** A diferencia de eliminación, un suizo admite empates de verdad (0.5 puntos cada uno) — nadie queda eliminado. */
  async function onSwissMatchFinished(
    tournament: typeof tournaments.$inferSelect,
    tm: typeof tournamentMatches.$inferSelect,
  ): Promise<void> {
    const players = await db
      .select({ userId: matchPlayers.userId, placement: matchPlayers.placement })
      .from(matchPlayers)
      .where(eq(matchPlayers.matchId, tm.matchId!));
    const placementByUser = new Map(players.map((p) => [p.userId, p.placement ?? Number.MAX_SAFE_INTEGER]));

    const a = tm.participantAId!;
    const b = tm.participantBId!;
    const placementA = placementByUser.get(a)!;
    const placementB = placementByUser.get(b)!;

    let winnerUserId: string | null;
    let resultA: 'win' | 'lose' | 'draw';
    let resultB: 'win' | 'lose' | 'draw';
    if (placementA < placementB) {
      winnerUserId = a;
      resultA = 'win';
      resultB = 'lose';
    } else if (placementB < placementA) {
      winnerUserId = b;
      resultA = 'lose';
      resultB = 'win';
    } else {
      winnerUserId = null;
      resultA = 'draw';
      resultB = 'draw';
    }

    await db.update(tournamentMatches).set({ winnerUserId, state: 'finished' }).where(eq(tournamentMatches.id, tm.id));
    await addPoints(tm.tournamentId, a, pointsForResult(resultA));
    await addPoints(tm.tournamentId, b, pointsForResult(resultB));

    const [round] = await db.select().from(tournamentRounds).where(eq(tournamentRounds.id, tm.roundId)).limit(1);
    await advanceSwissRound(
      tm.tournamentId,
      tournament.gameId,
      tournament.turnDurationS ?? 30,
      tournament.rated,
      tm.roundId,
      round!.roundNumber,
      tournament.totalRounds!,
    );
  }

  async function onMatchFinishedHook(matchId: string): Promise<void> {
    const [tm] = await db.select().from(tournamentMatches).where(eq(tournamentMatches.matchId, matchId)).limit(1);
    if (!tm) return; // partida normal, no es de torneo

    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tm.tournamentId)).limit(1);
    if (!tournament || tournament.state !== 'running') return;

    if (tournament.format === 'swiss') {
      await onSwissMatchFinished(tournament, tm);
    } else {
      await onEliminationMatchFinished(tournament, tm);
    }
  }

  onMatchFinished((_db, matchId) => onMatchFinishedHook(matchId));

  return {
    async startTournament(tournamentId, requestingUserId) {
      const [t] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
      if (!t) throw new Error('El torneo no existe');
      if (t.hostUserId !== requestingUserId) throw new Error('Solo el organizador puede iniciar el torneo');
      if (t.state !== 'registration') throw new Error('El torneo ya ha empezado o ha terminado');

      const checkedIn = await db
        .select({ userId: tournamentParticipants.userId })
        .from(tournamentParticipants)
        .where(and(eq(tournamentParticipants.tournamentId, tournamentId), eq(tournamentParticipants.status, 'checked_in')));
      if (checkedIn.length < 2) throw new Error('Hacen falta al menos 2 participantes confirmados');

      const ratings = await ratingsForUsers(t.gameId, checkedIn.map((c) => c.userId));
      const orderedByRating = [...checkedIn].sort(
        (x, y) => (ratings.get(y.userId) ?? DEFAULT_RATING) - (ratings.get(x.userId) ?? DEFAULT_RATING),
      );

      for (let i = 0; i < orderedByRating.length; i++) {
        await db
          .update(tournamentParticipants)
          .set({ seed: i + 1 })
          .where(
            and(
              eq(tournamentParticipants.tournamentId, tournamentId),
              eq(tournamentParticipants.userId, orderedByRating[i]!.userId),
            ),
          );
      }

      if (t.format === 'swiss') {
        const totalRounds = swissRoundsForSize(orderedByRating.length);
        await db.update(tournaments).set({ state: 'running', startedAt: new Date(), totalRounds }).where(eq(tournaments.id, tournamentId));

        const standings: SwissStanding[] = orderedByRating.map((p, i) => ({ id: p.userId, points: 0, seed: i + 1 }));
        const slots = pairSwissRound(standings, new Set(), new Set());
        const roundId = await generateRound(tournamentId, t.gameId, t.turnDurationS ?? 30, t.rated, 1, slots);
        await awardByePoints(tournamentId, roundId);
        return;
      }

      const size = nextPowerOfTwo(orderedByRating.length);
      const totalRounds = totalRoundsForSize(size);
      await db.update(tournaments).set({ state: 'running', startedAt: new Date(), totalRounds }).where(eq(tournaments.id, tournamentId));

      const slots = assignBracket(orderedByRating.map((p) => p.userId));
      await generateRound(tournamentId, t.gameId, t.turnDurationS ?? 30, t.rated, 1, slots);
    },

    async recoverOnBoot() {
      const running = await db.select().from(tournaments).where(eq(tournaments.state, 'running'));
      for (const t of running) {
        const [latestRound] = await db
          .select()
          .from(tournamentRounds)
          .where(eq(tournamentRounds.tournamentId, t.id))
          .orderBy(desc(tournamentRounds.roundNumber))
          .limit(1);
        if (!latestRound) continue;

        if (t.format === 'swiss') {
          await advanceSwissRound(
            t.id,
            t.gameId,
            t.turnDurationS ?? 30,
            t.rated,
            latestRound.id,
            latestRound.roundNumber,
            t.totalRounds!,
          );
        } else {
          await advanceEliminationRound(t.id, t.gameId, t.turnDurationS ?? 30, t.rated, latestRound.id, latestRound.roundNumber);
        }
      }
    },
  };
}
