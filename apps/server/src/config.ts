import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// El .env vive en la raíz del monorepo; en producción las variables
// llegan por el entorno del proceso y este load es un no-op.
loadDotenv({ path: resolve(import.meta.dirname, '../../../.env') });

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('127.0.0.1'),
  WEB_ORIGIN: z.url().default('http://localhost:5173'),
  DATABASE_URL: z.url(),
  SESSION_PEPPER: z.string().min(8),
  ENCRYPTION_KEY: z.base64().refine((v) => Buffer.from(v, 'base64').length === 32, {
    message: 'ENCRYPTION_KEY debe ser 32 bytes en base64',
  }),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  EMAIL_FROM: z.string().default('Tableria <no-reply@tableria.app>'),
  // Solo se define dentro del contenedor de producción: ruta a los estáticos ya
  // compilados de apps/web. En dev no se define nunca (Vite sirve el frontend aparte).
  WEB_DIST_PATH: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Cookies `Secure` según el esquema real de `WEB_ORIGIN`, no según NODE_ENV: así funciona
 * tanto en LAN por http:// (sin Cloudflare Tunnel todavía) como más adelante por https://. */
export function isHttps(url: string): boolean {
  return new URL(url).protocol === 'https:';
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    // Abortamos el arranque: nunca correr con configuración incompleta
    console.error('Configuración de entorno inválida:');
    console.error(z.prettifyError(parsed.error));
    process.exit(1);
  }
  return parsed.data;
}
