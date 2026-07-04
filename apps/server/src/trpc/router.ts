import { router } from './trpc.js';
import { gamesRouter } from './routers/games.js';

export const appRouter = router({
  games: gamesRouter,
});

export type AppRouter = typeof appRouter;
