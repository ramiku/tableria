import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { Db } from '@tableria/db';
import { SESSION_COOKIE, getUserFromToken, type SessionUser } from '../auth/session.js';
import type { Env } from '../config.js';
import type { MatchService } from '../match/service.js';

export interface TrpcContext {
  db: Db;
  user: SessionUser | null;
  matchService: MatchService;
}

export function createContext(db: Db, env: Env, matchService: MatchService) {
  return async ({ req }: CreateFastifyContextOptions): Promise<TrpcContext> => {
    const token = req.cookies[SESSION_COOKIE];
    const user = token ? await getUserFromToken(db, env.SESSION_PEPPER, token) : null;
    return { db, user, matchService };
  };
}
