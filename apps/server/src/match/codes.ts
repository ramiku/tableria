import { randomInt } from 'node:crypto';

// Sin 0/O/1/I para evitar confusiones al dictar o teclear el código.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export function generateMatchCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

const UNIQUE_VIOLATION = '23505';

/** Reintenta la inserción con un código nuevo si choca con la constraint única. */
export async function insertWithUniqueCode<T>(
  attempt: (code: string) => Promise<T>,
  maxRetries = 5,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await attempt(generateMatchCode());
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      if (code !== UNIQUE_VIOLATION || i === maxRetries - 1) throw err;
    }
  }
  throw new Error('No se pudo generar un código de sala único');
}
