import { describe, expect, it } from 'vitest';
import { envSchema } from './config.js';

const validEnv = {
  DATABASE_URL: 'postgres://tableria:tableria_dev@localhost:5432/tableria',
  SESSION_PEPPER: 'test-pepper-123',
  ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
};

describe('envSchema', () => {
  it('acepta un entorno mínimo válido y aplica defaults', () => {
    const env = envSchema.parse(validEnv);
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.WEB_ORIGIN).toBe('http://localhost:5173');
  });

  it('rechaza un DATABASE_URL ausente', () => {
    const { DATABASE_URL: _omitted, ...rest } = validEnv;
    expect(envSchema.safeParse(rest).success).toBe(false);
  });

  it('rechaza una ENCRYPTION_KEY que no sea de 32 bytes', () => {
    const result = envSchema.safeParse({
      ...validEnv,
      ENCRYPTION_KEY: Buffer.alloc(16, 7).toString('base64'),
    });
    expect(result.success).toBe(false);
  });

  it('coerciona PORT numérico desde string', () => {
    const env = envSchema.parse({ ...validEnv, PORT: '4123' });
    expect(env.PORT).toBe(4123);
  });
});
