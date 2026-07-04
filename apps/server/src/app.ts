import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { createDb, sql, type Db } from '@tableria/db';
import type { Env } from './config.js';
import { registerCsrf } from './auth/csrf.js';
import { createMailer } from './auth/mailer.js';
import { registerAuthRoutes } from './auth/routes.js';

export async function buildApp(env: Env, db: Db = createDb(env.DATABASE_URL)) {
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

  registerCsrf(app, env.NODE_ENV === 'production');

  app.decorate('db', db);

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

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
  }
}
