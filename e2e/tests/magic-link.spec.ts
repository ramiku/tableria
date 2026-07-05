import { expect, test, type APIRequestContext } from '@playwright/test';
import { registerViaUi, uniqueUsername } from './helpers.js';

const MAILHOG = 'http://127.0.0.1:8025';

function decodeQuotedPrintable(str: string): string {
  return str.replace(/=\r?\n/g, '').replace(/=([A-Fa-f0-9]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

async function findMagicLinkUrl(request: APIRequestContext, toEmail: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const res = await request.get(`${MAILHOG}/api/v2/messages`);
    const data = (await res.json()) as { items: { To: { Mailbox: string; Domain: string }[]; Content: { Body: string } }[] };
    const msg = data.items.find(
      (m) => m.To.some((t) => `${t.Mailbox}@${t.Domain}` === toEmail) && /entrar/.test(m.Content.Body),
    );
    if (msg) {
      const body = decodeQuotedPrintable(msg.Content.Body);
      const match = /http:\/\/[^\s<]+\/entrar\?token=[A-Za-z0-9]+/.exec(body);
      if (match) return match[0];
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('No llegó el correo del enlace mágico a tiempo');
}

test('entrar sin contraseña con un enlace mágico', async ({ page, request }) => {
  const username = uniqueUsername('e2emagic');
  const email = `${username}@example.com`;

  // Cuenta creada en un contexto aparte; esta prueba entra sin volver a usar la contraseña.
  await registerViaUi(page, username);
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');

  await page.getByRole('link', { name: 'Entrar sin contraseña' }).click();
  await page.waitForURL('**/entrar');
  await page.locator('#magic-identifier').fill(username);
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByText('Revisa tu correo')).toBeVisible();

  const magicUrl = await findMagicLinkUrl(request, email);
  const relativeUrl = magicUrl.replace(/^https?:\/\/[^/]+/, '');

  await page.goto(relativeUrl);
  await page.waitForURL('**/');
  await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();

  // Reutilizar el mismo enlace debe fallar (un solo uso).
  await page.goto(relativeUrl);
  await expect(page.getByText('El enlace no es válido o ha caducado')).toBeVisible();
});
