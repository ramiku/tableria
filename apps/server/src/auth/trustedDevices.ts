import { and, desc, eq, gt, trustedDevices, type Db } from '@tableria/db';
import { hashToken, randomToken } from './crypto.js';

export const TRUSTED_DEVICE_COOKIE = 'tb_trusted';
export const TRUSTED_DEVICE_TTL_DAYS = 30;

export async function createTrustedDevice(
  db: Db,
  pepper: string,
  userId: string,
  userAgent: string | undefined,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken();
  const tokenHash = hashToken(token, pepper);
  const expiresAt = new Date(Date.now() + TRUSTED_DEVICE_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(trustedDevices).values({ userId, tokenHash, userAgent, expiresAt });
  return { token, expiresAt };
}

/** true si el token de dispositivo de confianza es válido para ESTE usuario (evita colar la cookie de otra cuenta). */
export async function isTrustedDevice(db: Db, pepper: string, token: string, userId: string): Promise<boolean> {
  const tokenHash = hashToken(token, pepper);
  const rows = await db
    .select({ id: trustedDevices.id })
    .from(trustedDevices)
    .where(and(eq(trustedDevices.tokenHash, tokenHash), eq(trustedDevices.userId, userId), gt(trustedDevices.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row) return false;
  void db.update(trustedDevices).set({ lastUsedAt: new Date() }).where(eq(trustedDevices.id, row.id));
  return true;
}

export interface TrustedDeviceEntry {
  id: string;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
}

export function listTrustedDevices(db: Db, userId: string): Promise<TrustedDeviceEntry[]> {
  return db
    .select({
      id: trustedDevices.id,
      userAgent: trustedDevices.userAgent,
      createdAt: trustedDevices.createdAt,
      lastUsedAt: trustedDevices.lastUsedAt,
      expiresAt: trustedDevices.expiresAt,
    })
    .from(trustedDevices)
    .where(eq(trustedDevices.userId, userId))
    .orderBy(desc(trustedDevices.createdAt));
}

export async function revokeTrustedDevice(db: Db, userId: string, deviceId: string): Promise<void> {
  await db.delete(trustedDevices).where(and(eq(trustedDevices.id, deviceId), eq(trustedDevices.userId, userId)));
}

export async function revokeAllTrustedDevices(db: Db, userId: string): Promise<void> {
  await db.delete(trustedDevices).where(eq(trustedDevices.userId, userId));
}
