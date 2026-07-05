import { randomBytes, createCipheriv, createDecipheriv, createHmac } from 'node:crypto';
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

const GCM_IV_LENGTH = 12;

/**
 * AES-256-GCM para secretos en reposo (hoy: el secreto TOTP). `key` es
 * `ENCRYPTION_KEY` (32 bytes en base64) ya validado por `config.ts`. IV
 * aleatorio por llamada; formato guardado: `iv.authTag.ciphertext` en base64.
 */
export function encryptSecret(plaintext: string, keyBase64: string): string {
  const key = Buffer.from(keyBase64, 'base64');
  const iv = randomBytes(GCM_IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${authTag.toString('base64')}.${ciphertext.toString('base64')}`;
}

export function decryptSecret(encoded: string, keyBase64: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encoded.split('.');
  if (!ivB64 || !authTagB64 || !ciphertextB64) throw new Error('Secreto cifrado con formato inválido');
  const key = Buffer.from(keyBase64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()]);
  return plaintext.toString('utf8');
}
