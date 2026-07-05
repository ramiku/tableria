import {
  and,
  desc,
  eq,
  inArray,
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
   * resuelto sin crear partida. `slots` ya viene en el orden de bracket correcto
   * (de `assignBracket` en la ronda 1, o de los ganadores de la ronda anterior
   * en las siguientes — ese orden ya es el seeding correcto, no hace falta reordenar).
   */
  async function generateRound(
    tournamentId: string,
    gameId: string,
    turnDurationS: number,
    rated: boolean,
    roundNumber: number,
    slots: (string | null)[],
  ): Promise<void> {
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
  }

  async function finishTournament(tournamentId: string, championUserId: string): Promise<void> {
    await db
      .update(tournamentParticipants)
      .set({ finalPlacement: 1 })
      .where(and(eq(tournamentParticipants.tournamentId, tournamentId), eq(tournamentParticipants.userId, championUserId)));
    await db.update(tournaments).set({ state: 'finished', finishedAt: new Date() }).where(eq(tournaments.id, tournamentId));
  }

  /**
   * Avanza una ronda completamente resuelta (todas sus `tournamentMatches` en
   * `finished`): junta los ganadores en orden de `slotIndex` y genera la
   * siguiente ronda, o cierra el torneo si solo quedaba una partida.
   */
  async function advanceIfRoundComplete(
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
      await finishTournament(tournamentId, winners[0]!);
      return;
    }

    await generateRound(tournamentId, gameId, turnDurationS, rated, roundNumber + 1, winners);
  }

  async function onMatchFinishedHook(matchId: string): Promise<void> {
    const [tm] = await db.select().from(tournamentMatches).where(eq(tournamentMatches.matchId, matchId)).limit(1);
    if (!tm) return; // partida normal, no es de torneo

    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tm.tournamentId)).limit(1);
    if (!tournament || tournament.state !== 'running') return;

    const players = await db
      .select({ userId: matchPlayers.userId, placement: matchPlayers.placement })
      .from(matchPlayers)
      .where(eq(matchPlayers.matchId, matchId));
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

    await advanceIfRoundComplete(
      tm.tournamentId,
      tournament.gameId,
      tournament.turnDurationS ?? 30,
      tournament.rated,
      tm.roundId,
      round!.roundNumber,
    );
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

      const size = nextPowerOfTwo(orderedByRating.length);
      const totalRounds = totalRoundsForSize(size);

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

      await db
        .update(tournaments)
        .set({ state: 'running', startedAt: new Date(), totalRounds })
        .where(eq(tournaments.id, tournamentId));

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
        await advanceIfRoundComplete(t.id, t.gameId, t.turnDurationS ?? 30, t.rated, latestRound.id, latestRound.roundNumber);
      }
    },
  };
}
