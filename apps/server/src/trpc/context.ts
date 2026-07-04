import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { Db } from '@tableria/db';

export interface TrpcContext {
  db: Db;
}

export function createContext(db: Db) {
  return async (_opts: CreateFastifyContextOptions): Promise<TrpcContext> => ({ db });
}
