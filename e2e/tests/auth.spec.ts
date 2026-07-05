import { expect, test } from '@playwright/test';
import { PASSWORD, registerViaUi, uniqueUsername } from './helpers.js';

test('registro, logout y login de vuelta', async ({ page }) => {
  const username = uniqueUsername('e2eauth');

  await registerViaUi(page, username);
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');

  await page.locator('#login-identifier').fill(username);
  await page.locator('#login-password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/');
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
});
