import { resolve } from 'node:path';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import staticFiles from '@fastify/static';
import websocket from '@fastify/websocket';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createDb, sql, type Db } from '@tableria/db';
import { isHttps, type Env } from './config.js';
import { registerCsrf } from './auth/csrf.js';
import { createMailer } from './auth/mailer.js';
import { registerAuthRoutes } from './auth/routes.js';
import { appRouter } from './trpc/router.js';
import { createContext } from './trpc/context.js';
import { createMatchService, type MatchService } from './match/service.js';
import { createSocialService, type SocialService } from './social/service.js';
import { createVoiceService, type VoiceService } from './voice/service.js';
import { createTournamentService, type TournamentService } from './tournaments/service.js';
import { getMaintenanceStatus } from './settings/service.js';
import { registerWsGateway } from './ws/gateway.js';

export async function buildApp(
  env: Env,
  db: Db = createDb(env.DATABASE_URL),
  matchService: MatchService = createMatchService(db),
  socialService: SocialService = createSocialService(db),
  voiceService: VoiceService = createVoiceService(db, matchService),
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

  registerCsrf(app, isHttps(env.WEB_ORIGIN));

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

  // Sin autenticación: el cliente lo consulta antes incluso de saber si hay sesión,
  // para poder pintar la pantalla de mantenimiento a cualquiera.
  app.get('/api/maintenance-status', async () => {
    const status = await getMaintenanceStatus(db);
    return { ok: true, ...status };
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

  registerWsGateway(app, db, env, matchService, socialService, voiceService);

  // Solo en el contenedor de producción (ver Dockerfile): sirve los estáticos ya
  // compilados de apps/web desde el mismo origen que la API — sin nginx, sin CORS,
  // sin líos de cookies cross-site, y es justo lo que luego querrá Cloudflare Tunnel
  // (un único puerto local al que apuntar).
  if (env.WEB_DIST_PATH) {
    await app.register(staticFiles, { root: resolve(env.WEB_DIST_PATH) });
    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith('/api') || request.raw.url === '/health') {
        return reply.code(404).send({ ok: false, error: 'No encontrado' });
      }
      // Fallback de SPA: cualquier otra ruta la resuelve el enrutado por historial del cliente.
      return reply.sendFile('index.html');
    });
  }

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
