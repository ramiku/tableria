import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export * from './schema.js';
export { schema };
export { sql, eq, ne, and, or, desc, asc, isNull, gt, lt, inArray } from 'drizzle-orm';

export type Db = ReturnType<typeof createDb>;
/** Tipo del `tx` recibido dentro de `db.transaction(async (tx) => ...)` — para helpers compartidos que reciben la transacción en curso. */
export type Tx = Parameters<Db['transaction']>[0] extends (tx: infer T) => unknown ? T : never;

export function createDb(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    onnotice: () => {}, // silenciar NOTICE en dev
  });
  return drizzle(client, { schema, casing: 'snake_case' });
}
