import type { Page } from '@playwright/test';

/** Nicks están limitados a 20 caracteres — mantener el prefijo corto (<=10). */
export function uniqueUsername(prefix: string): string {
  const suffix = Date.now().toString(36).slice(-5) + Math.floor(Math.random() * 46656).toString(36);
  const username = `${prefix}${suffix}`;
  if (username.length > 20) throw new Error(`Prefijo demasiado largo para un nick único bajo 20 caracteres: "${prefix}"`);
  return username;
}

export const PASSWORD = 'correcthorsebatterystaple';

/** Registra una cuenta nueva desde la UI real y deja la sesión iniciada (queda en el catálogo). */
export async function registerViaUi(page: Page, username: string): Promise<void> {
  await page.goto('/registro');
  await page.locator('#username').fill(username);
  await page.locator('#email').fill(`${username}@example.com`);
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.waitForURL('**/');
}
