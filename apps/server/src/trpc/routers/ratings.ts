import { z } from 'zod';
import { and, desc, eq, games, inArray, seasons, userGameRatings, userGameStats, users } from '@tableria/db';
import { protectedProcedure, publicProcedure, router } from '../trpc.js';

export const ratingsRouter = router({
  /** Top de la temporada activa para un juego — usado por /rankings. */
  leaderboard: publicProcedure.input(z.object({ gameId: z.string() })).query(async ({ ctx, input }) => {
    const [season] = await ctx.db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);
    if (!season) return { season: null, entries: [] };

    const rows = await ctx.db
      .select({
        userId: userGameRatings.userId,
        username: users.username,
        avatarInitial: users.avatarInitial,
        avatarColor: users.avatarColor,
        rating: userGameRatings.rating,
        rd: userGameRatings.rd,
        wins: userGameRatings.wins,
        losses: userGameRatings.losses,
        draws: userGameRatings.draws,
        peakRating: userGameRatings.peakRating,
      })
      .from(userGameRatings)
      .innerJoin(users, eq(users.id, userGameRatings.userId))
      .where(and(eq(userGameRatings.gameId, input.gameId), eq(userGameRatings.seasonId, season.id)))
      .orderBy(desc(userGameRatings.rating))
      .limit(50);

    return { season: { id: season.id, name: season.name }, entries: rows };
  }),

  /** Rating + stats del usuario autenticado, por juego (activos en el catálogo). */
  mySummary: protectedProcedure.query(async ({ ctx }) => {
    const [season] = await ctx.db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);

    const catalog = await ctx.db.select({ gameId: games.id, gameName: games.name }).from(games).where(eq(games.isActive, true));

    const stats = await ctx.db.select().from(userGameStats).where(eq(userGameStats.userId, ctx.user.id));
    const statsMap = new Map(stats.map((s) => [s.gameId, s]));

    const ratings = season
      ? await ctx.db
          .select()
          .from(userGameRatings)
          .where(and(eq(userGameRatings.userId, ctx.user.id), eq(userGameRatings.seasonId, season.id)))
      : [];
    const ratingsMap = new Map(ratings.map((r) => [r.gameId, r]));

    return catalog.map((game) => {
      const stat = statsMap.get(game.gameId);
      const rating = ratingsMap.get(game.gameId);
      return {
        gameId: game.gameId,
        gameName: game.gameName,
        played: stat?.played ?? 0,
        wins: stat?.wins ?? 0,
        losses: stat?.losses ?? 0,
        draws: stat?.draws ?? 0,
        lastPlayedAt: stat?.lastPlayedAt?.toISOString() ?? null,
        rating: rating?.rating ?? null,
        rd: rating?.rd ?? null,
        peakRating: rating?.peakRating ?? null,
      };
    });
  }),

  /** Historial en un juego para un grupo de jugadores (los de una mesa) — panel de fin de partida. */
  gameStats: protectedProcedure
    .input(z.object({ gameId: z.string(), userIds: z.array(z.uuid()).min(1).max(8) }))
    .query(async ({ ctx, input }) => {
      const [season] = await ctx.db.select().from(seasons).where(eq(seasons.isActive, true)).limit(1);

      const stats = await ctx.db
        .select()
        .from(userGameStats)
        .where(and(eq(userGameStats.gameId, input.gameId), inArray(userGameStats.userId, input.userIds)));
      const statsMap = new Map(stats.map((s) => [s.userId, s]));

      const ratings = season
        ? await ctx.db
            .select()
            .from(userGameRatings)
            .where(
              and(
                eq(userGameRatings.gameId, input.gameId),
                eq(userGameRatings.seasonId, season.id),
                inArray(userGameRatings.userId, input.userIds),
              ),
            )
        : [];
      const ratingsMap = new Map(ratings.map((r) => [r.userId, r]));

      return input.userIds.map((userId) => {
        const stat = statsMap.get(userId);
        const rating = ratingsMap.get(userId);
        return {
          userId,
          played: stat?.played ?? 0,
          wins: stat?.wins ?? 0,
          losses: stat?.losses ?? 0,
          draws: stat?.draws ?? 0,
          rating: rating?.rating ?? null,
          peakRating: rating?.peakRating ?? null,
        };
      });
    }),
});
