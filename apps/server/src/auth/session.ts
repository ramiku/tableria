import { and, eq, gt, isNull, sessions, users, type Db } from '@tableria/db';
import { hashToken, randomToken } from './crypto.js';

export const SESSION_COOKIE = 'tb_sid';
export const SESSION_TTL_DAYS = 30;

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
}

export async function createSession(
  db: Db,
  pepper: string,
  userId: string,
  meta: { ip?: string; userAgent?: string },
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const tokenHash = hashToken(token, pepper);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({
    userId,
    tokenHash,
    ip: meta.ip,
    userAgent: meta.userAgent,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function getUserFromToken(db: Db, pepper: string, token: string): Promise<SessionUser | null> {
  const tokenHash = hashToken(token, pepper);
  const now = new Date();

  const rows = await db
    .select({ id: users.id, username: users.username, displayName: users.displayName, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt), gt(sessions.expiresAt, now)))
    .limit(1);

  const user = rows[0];
  if (!user) return null;

  // Actualización perezosa, no bloquea la respuesta
  void db.update(sessions).set({ lastUsedAt: now }).where(eq(sessions.tokenHash, tokenHash));

  return user;
}

export async function revokeSession(db: Db, pepper: string, token: string, reason = 'logout'): Promise<void> {
  const tokenHash = hashToken(token, pepper);
  await db
    .update(sessions)
    .set({ revokedAt: new Date(), revokedReason: reason })
    .where(eq(sessions.tokenHash, tokenHash));
}

/** Revoca todas las sesiones activas de un usuario (p.ej. tras un reset de contraseña). */
export async function revokeAllSessions(db: Db, userId: string, reason: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date(), revokedReason: reason })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}
