import { router } from './trpc.js';
import { gamesRouter } from './routers/games.js';
import { matchesRouter } from './routers/matches.js';

export const appRouter = router({
  games: gamesRouter,
  matches: matchesRouter,
});

export type AppRouter = typeof appRouter;
