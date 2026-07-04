import { z } from 'zod';
import { asc, desc, eq, gameCategories, gameContent, games } from '@tableria/db';
import { publicProcedure, router } from '../trpc.js';

export const gamesRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        slug: games.id,
        name: games.name,
        categorySlug: games.categorySlug,
        categoryName: gameCategories.name,
        minPlayers: games.minPlayers,
        maxPlayers: games.maxPlayers,
        durationMin: games.durationMin,
        badge: games.badge,
        coverBg: games.coverBg,
        coverFg: games.coverFg,
        description: games.description,
        isActive: games.isActive,
      })
      .from(games)
      .leftJoin(gameCategories, eq(games.categorySlug, gameCategories.slug))
      .orderBy(desc(games.isActive), asc(games.createdAt));

    return rows;
  }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const [game] = await ctx.db
      .select({
        slug: games.id,
        name: games.name,
        categorySlug: games.categorySlug,
        categoryName: gameCategories.name,
        minPlayers: games.minPlayers,
        maxPlayers: games.maxPlayers,
        durationMin: games.durationMin,
        badge: games.badge,
        coverBg: games.coverBg,
        coverFg: games.coverFg,
        description: games.description,
        isActive: games.isActive,
      })
      .from(games)
      .leftJoin(gameCategories, eq(games.categorySlug, gameCategories.slug))
      .where(eq(games.id, input.slug))
      .limit(1);

    if (!game) return null;

    const content = await ctx.db
      .select({ sectionKey: gameContent.sectionKey, body: gameContent.body })
      .from(gameContent)
      .where(eq(gameContent.gameId, input.slug));

    return { game, rules: content.find((c) => c.sectionKey === 'rules')?.body ?? null };
  }),
});
