import { randomBytes, createHmac } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';

/** Token opaco de alta entropía (256 bits), en hex para usar en cookies/URLs. */
export function randomToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * HMAC-SHA256 con SESSION_PEPPER como clave: lo que se guarda en BD para
 * tokens de sesión y de reseteo de contraseña. El pepper vive solo en el
 * entorno del servidor, así que un volcado de la BD sin el .env no basta
 * para reconstruir ni reutilizar los tokens.
 */
export function hashToken(token: string, pepper: string): string {
  return createHmac('sha256', pepper).update(token).digest('hex');
}

export function hashPassword(password: string): Promise<string> {
  return hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export function verifyPassword(hash_: string, password: string): Promise<boolean> {
  return verify(hash_, password);
}
