import { expect, test } from '@playwright/test';
import * as OTPAuth from 'otpauth';
import { PASSWORD, registerViaUi, uniqueUsername } from './helpers.js';

function codeFor(secretBase32: string): string {
  const totp = new OTPAuth.TOTP({ issuer: 'Tableria', label: 'e2e', secret: OTPAuth.Secret.fromBase32(secretBase32) });
  return totp.generate();
}

test('marcar "confiar en este dispositivo" salta el reto de 2FA en el siguiente login', async ({ page }) => {
  const username = uniqueUsername('e2etrust');
  await registerViaUi(page, username);

  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Activar 2FA' }).click();
  const secret = (await page.getByTestId('two-factor-secret').innerText()).trim();
  await page.locator('#two-factor-setup-code').fill(codeFor(secret));
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await page.getByRole('button', { name: 'Ya los he guardado' }).click();
  await expect(page.getByText('La verificación en dos pasos está activada')).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');
  await page.locator('#login-identifier').fill(username);
  await page.locator('#login-password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('Verificación en dos pasos')).toBeVisible();

  await page.locator('#two-factor-code').fill(codeFor(secret));
  await page.getByLabel(/confiar en este dispositivo|trust this device/i).check();
  await page.getByRole('button', { name: 'Verificar' }).click();
  await page.waitForURL('**/');

  // Segundo login desde el mismo navegador (misma cookie tb_trusted): no debe pedir 2FA.
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');
  await page.locator('#login-identifier').fill(username);
  await page.locator('#login-password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/');
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();

  // El dispositivo debe aparecer listado en el perfil.
  await page.goto('/perfil');
  await expect(page.getByText(/dispositivos de confianza/i)).toBeVisible();
});
