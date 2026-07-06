import { router } from './trpc.js';
import { activityRouter } from './routers/activity.js';
import { conversationsRouter } from './routers/conversations.js';
import { friendsRouter } from './routers/friends.js';
import { gamesRouter } from './routers/games.js';
import { matchesRouter } from './routers/matches.js';
import { moderationRouter } from './routers/moderation.js';
import { notificationsRouter } from './routers/notifications.js';
import { ratingsRouter } from './routers/ratings.js';
import { tournamentsRouter } from './routers/tournaments.js';
import { usersRouter } from './routers/users.js';

export const appRouter = router({
  games: gamesRouter,
  matches: matchesRouter,
  friends: friendsRouter,
  conversations: conversationsRouter,
  notifications: notificationsRouter,
  activity: activityRouter,
  ratings: ratingsRouter,
  tournaments: tournamentsRouter,
  moderation: moderationRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
