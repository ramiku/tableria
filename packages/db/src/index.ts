import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export * from './schema.js';
export { schema };
export { sql, eq, and, or, desc, asc, isNull, gt, lt } from 'drizzle-orm';

export type Db = ReturnType<typeof createDb>;

export function createDb(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    onnotice: () => {}, // silenciar NOTICE en dev
  });
  return drizzle(client, { schema, casing: 'snake_case' });
}
