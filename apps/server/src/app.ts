import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createDb, sql, type Db } from '@tableria/db';
import type { Env } from './config.js';
import { registerCsrf } from './auth/csrf.js';
import { createMailer } from './auth/mailer.js';
import { registerAuthRoutes } from './auth/routes.js';
import { appRouter } from './trpc/router.js';
import { createContext } from './trpc/context.js';
import { createMatchService, type MatchService } from './match/service.js';
import { createSocialService, type SocialService } from './social/service.js';
import { createTournamentService, type TournamentService } from './tournaments/service.js';
import { registerWsGateway } from './ws/gateway.js';

export async function buildApp(
  env: Env,
  db: Db = createDb(env.DATABASE_URL),
  matchService: MatchService = createMatchService(db),
  socialService: SocialService = createSocialService(db),
  tournamentService: TournamentService = createTournamentService(db, matchService),
) {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } } }
        : true,
  });

  await app.register(cookie);
  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
  });
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
  await app.register(websocket);

  registerCsrf(app, env.NODE_ENV === 'production');

  app.decorate('db', db);
  app.decorate('matchService', matchService);
  app.decorate('socialService', socialService);
  app.decorate('tournamentService', tournamentService);

  app.get('/health', async () => {
    let dbStatus: 'up' | 'down' = 'up';
    try {
      await db.execute(sql`SELECT 1`);
    } catch {
      dbStatus = 'down';
    }
    return { ok: dbStatus === 'up', db: dbStatus, uptime: process.uptime() };
  });

  const mailer = createMailer(env);
  await registerAuthRoutes(app, { db, env, mailer });

  await app.register(fastifyTRPCPlugin, {
    prefix: '/api/trpc',
    trpcOptions: {
      router: appRouter,
      createContext: createContext(db, env, matchService, socialService, tournamentService),
    },
  });

  registerWsGateway(app, db, env, matchService, socialService);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
    matchService: MatchService;
    socialService: SocialService;
    tournamentService: TournamentService;
  }
}
