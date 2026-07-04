import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { createDb, sql, type Db } from '@tableria/db';
import type { Env } from './config.js';

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

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    db: Db;
  }
}
