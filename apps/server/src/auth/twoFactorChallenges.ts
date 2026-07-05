import { randomToken } from './crypto.js';

/**
 * Retos de 2FA pendientes entre "contraseña verificada" y "código TOTP verificado".
 * Viven solo en memoria a propósito: efímeros (5 min) y de bajo valor — un
 * reinicio del servidor a mitad del reto solo obliga a reintentar el login,
 * no justifica una tabla nueva. El intento fallido NO invalida el reto (la
 * protección contra fuerza bruta es el rate-limit de la ruta, no un solo intento).
 */
interface Challenge {
  userId: string;
  expiresAt: number;
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const challenges = new Map<string, Challenge>();

function sweepExpired(): void {
  const now = Date.now();
  for (const [token, c] of challenges) {
    if (c.expiresAt < now) challenges.delete(token);
  }
}

export function createChallenge(userId: string): string {
  sweepExpired();
  const token = randomToken();
  challenges.set(token, { userId, expiresAt: Date.now() + CHALLENGE_TTL_MS });
  return token;
}

/** Consulta el reto sin invalidarlo — para permitir reintentar un código incorrecto. */
export function peekChallenge(token: string): string | null {
  const entry = challenges.get(token);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.userId;
}

export function invalidateChallenge(token: string): void {
  challenges.delete(token);
}
