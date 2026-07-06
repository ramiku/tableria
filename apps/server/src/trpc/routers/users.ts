import { z } from 'zod';
import { eq, sql, userGameStats, users } from '@tableria/db';
import { protectedProcedure, router } from '../trpc.js';

export const usersRouter = router({
  /** Perfil público mínimo — alimenta la tarjeta que aparece al pasar el ratón sobre cualquier jugador. */
  publicProfile: protectedProcedure.input(z.object({ userId: z.uuid() })).query(async ({ ctx, input }) => {
    const [user] = await ctx.db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarInitial: users.avatarInitial,
        avatarColor: users.avatarColor,
        createdAt: users.createdAt,
        reputation: users.reputation,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    if (!user) return null;

    const [totals] = await ctx.db
      .select({
        played: sql<number>`coalesce(sum(${userGameStats.played}), 0)::int`,
        wins: sql<number>`coalesce(sum(${userGameStats.wins}), 0)::int`,
      })
      .from(userGameStats)
      .where(eq(userGameStats.userId, input.userId));

    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarInitial: user.avatarInitial,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt.toISOString(),
      reputation: user.reputation,
      totalPlayed: totals?.played ?? 0,
      totalWins: totals?.wins ?? 0,
    };
  }),
});
