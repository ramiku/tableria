import { defineConfig } from '@playwright/test';

/**
 * Flujos críticos de punta a punta contra la app real (Fastify + Vite + Postgres).
 * `reuseExistingServer` detecta el `pnpm dev` ya levantado en desarrollo — en CI
 * (sin servidor previo) Playwright arrancaría uno nuevo con el comando de abajo.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // los specs de auth comparten servidor+BD reales; evita carreras entre ellos
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm --dir .. dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
