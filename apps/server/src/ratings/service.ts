import { and, eq, matchPlayers, ratingHistory, seasons, userGameRatings, userGameStats, type Tx } from '@tableria/db';
import type { PlayerRank } from '@tableria/engine';
import { updateGlickoForRanking, type GlickoRating } from './glicko.js';

const DEFAULT_RATING: GlickoRating = { rating: 1500, rd: 350, vol: 0.06 };

export type RatingDeltas = Map<number, { ratingBefore: number; ratingAfter: number }>;

/**
 * Se llama dentro de la MISMA transacción que cierra una partida
 * (`match/lifecycle.ts`, tanto en fin natural como en forfeit). Escribe
 * `userGameStats` siempre; si la partida era `rated`, además actualiza el
 * rating Glicko-2 de la temporada activa y el historial.
 *
 * @param seatToUserId mapa asiento → userId (orden estable, ya resuelto por el llamador)
 * @returns delta de rating por asiento (vacío si la partida no era rated), para incluirlo en el broadcast de fin de partida
 */
export async function applyMatchResult(
  tx: Tx,
  params: { matchId: string; gameId: string; rated: boolean; ranking: PlayerRank[]; seatToUserId: Map<number, string> },
): Promise<RatingDeltas> {
  const { matchId, gameId, rated, ranking, seatToUserId } = params;
  const deltas = new Map<number, { ratingBefore: number; ratingAfter: number }>();

  for (const rank of ranking) {
    const userId = seatToUserId.get(rank.seat);
    if (!userId) continue;
    await upsertStats(tx, userId, gameId, rank.result);
  }

  if (!rated) return deltas;

  const [season] = await tx.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
  if (!season) return deltas;

  const players = await Promise.all(
    ranking.map(async (rank) => {
      const userId = seatToUserId.get(rank.seat)!;
      const [existing] = await tx
        .select()
        .from(userGameRatings)
        .where(
          and(
            eq(userGameRatings.userId, userId),
            eq(userGameRatings.gameId, gameId),
            eq(userGameRatings.seasonId, season.id),
          ),
        )
        .limit(1);
      const before: GlickoRating = existing
        ? { rating: existing.rating, rd: existing.rd, vol: existing.vol }
        : DEFAULT_RATING;
      return { seat: rank.seat, userId, placement: rank.placement, before, existing };
    }),
  );

  const updated = updateGlickoForRanking(
    players.map((p) => ({ id: p.seat, placement: p.placement, rating: p.before })),
  );

  const minPlacement = Math.min(...players.map((p) => p.placement));
  const winnersAtMin = players.filter((p) => p.placement === minPlacement).length;

  for (const p of players) {
    const after = updated.get(p.seat)!;
    const isAtMin = p.placement === minPlacement;
    const wins = (p.existing?.wins ?? 0) + (isAtMin && winnersAtMin === 1 ? 1 : 0);
    const draws = (p.existing?.draws ?? 0) + (isAtMin && winnersAtMin > 1 ? 1 : 0);
    const losses = (p.existing?.losses ?? 0) + (isAtMin ? 0 : 1);
    const peakRating = Math.max(p.existing?.peakRating ?? DEFAULT_RATING.rating, after.rating);

    await tx
      .insert(userGameRatings)
      .values({
        userId: p.userId,
        gameId,
        seasonId: season.id,
        rating: after.rating,
        rd: after.rd,
        vol: after.vol,
        wins,
        losses,
        draws,
        peakRating,
      })
      .onConflictDoUpdate({
        target: [userGameRatings.userId, userGameRatings.gameId, userGameRatings.seasonId],
        set: { rating: after.rating, rd: after.rd, vol: after.vol, wins, losses, draws, peakRating, updatedAt: new Date() },
      });

    await tx.insert(ratingHistory).values({
      userId: p.userId,
      gameId,
      seasonId: season.id,
      matchId,
      ratingBefore: p.before.rating,
      ratingAfter: after.rating,
      rdBefore: p.before.rd,
      rdAfter: after.rd,
    });

    await tx
      .update(matchPlayers)
      .set({ ratingBefore: p.before.rating, ratingAfter: after.rating })
      .where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.seat, p.seat)));

    deltas.set(p.seat, { ratingBefore: p.before.rating, ratingAfter: after.rating });
  }

  return deltas;
}

async function upsertStats(tx: Tx, userId: string, gameId: string, result: PlayerRank['result']): Promise<void> {
  const [existing] = await tx
    .select()
    .from(userGameStats)
    .where(and(eq(userGameStats.userId, userId), eq(userGameStats.gameId, gameId)))
    .limit(1);

  const played = (existing?.played ?? 0) + 1;
  const wins = (existing?.wins ?? 0) + (result === 'win' ? 1 : 0);
  const losses = (existing?.losses ?? 0) + (result === 'lose' ? 1 : 0);
  const draws = (existing?.draws ?? 0) + (result === 'draw' ? 1 : 0);

  await tx
    .insert(userGameStats)
    .values({ userId, gameId, played, wins, losses, draws, lastPlayedAt: new Date() })
    .onConflictDoUpdate({
      target: [userGameStats.userId, userGameStats.gameId],
      set: { played, wins, losses, draws, lastPlayedAt: new Date() },
    });
}
