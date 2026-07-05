import { expect, test } from '@playwright/test';
import * as OTPAuth from 'otpauth';
import { PASSWORD, registerViaUi, uniqueUsername } from './helpers.js';

function codeFor(secretBase32: string): string {
  const totp = new OTPAuth.TOTP({ issuer: 'Tableria', label: 'e2e', secret: OTPAuth.Secret.fromBase32(secretBase32) });
  return totp.generate();
}

test('activar 2FA, entrar con el código y con un backup code', async ({ page }) => {
  const username = uniqueUsername('e2etfa');
  await registerViaUi(page, username);

  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Activar 2FA' }).click();

  const secret = (await page.getByTestId('two-factor-secret').innerText()).trim();
  await page.locator('#two-factor-setup-code').fill(codeFor(secret));
  await page.getByRole('button', { name: 'Confirmar' }).click();

  const backupCode = (await page.getByTestId('backup-code').first().innerText()).trim();
  await page.getByRole('button', { name: 'Ya los he guardado' }).click();
  await expect(page.getByText('La verificación en dos pasos está activada')).toBeVisible();

  // Primer login tras activar 2FA: pide el código del autenticador.
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');
  await page.locator('#login-identifier').fill(username);
  await page.locator('#login-password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Verificación en dos pasos')).toBeVisible();

  await page.locator('#two-factor-code').fill(codeFor(secret));
  await page.getByRole('button', { name: 'Verificar' }).click();
  await page.waitForURL('**/');
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();

  // Segundo login: entra con un backup code en vez del código del autenticador.
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');
  await page.locator('#login-identifier').fill(username);
  await page.locator('#login-password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Verificación en dos pasos')).toBeVisible();

  await page.locator('#two-factor-code').fill(backupCode);
  await page.getByRole('button', { name: 'Verificar' }).click();
  await page.waitForURL('**/');
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
});
