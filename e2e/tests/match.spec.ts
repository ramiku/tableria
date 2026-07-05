import { expect, test } from '@playwright/test';
import { registerViaUi, uniqueUsername } from './helpers.js';

test('dos jugadores completan una partida de tres en raya de principio a fin', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    const usernameA = uniqueUsername('e2ematcha');
    const usernameB = uniqueUsername('e2ematchb');
    await registerViaUi(pageA, usernameA);
    await registerViaUi(pageB, usernameB);

    // A crea la mesa (queda sentado en el asiento 0 → X, primer turno).
    await pageA.goto('/juegos/tres-en-raya');
    await pageA.getByRole('button', { name: 'Comenzar' }).click();
    const code = (await pageA.getByTestId('room-code').innerText()).trim();

    // Ambos confirman desde /sala/$code — misma página, mismo botón para los dos.
    await pageA.goto(`/sala/${code}`);
    await pageB.goto(`/sala/${code}`);

    await pageA.getByRole('button', { name: 'Estoy listo' }).click();
    await pageB.getByRole('button', { name: 'Estoy listo' }).click();

    await pageA.waitForURL('**/partida/*');
    await pageB.waitForURL('**/partida/*');

    // A (X) gana la fila superior: columnas 1,2,3. B (O) juega debajo, sin ganar.
    await pageA.getByRole('button', { name: 'Fila 1, columna 1: vacía' }).click();
    await pageB.getByRole('button', { name: 'Fila 2, columna 1: vacía' }).click();
    await pageA.getByRole('button', { name: 'Fila 1, columna 2: vacía' }).click();
    await pageB.getByRole('button', { name: 'Fila 2, columna 2: vacía' }).click();
    await pageA.getByRole('button', { name: 'Fila 1, columna 3: vacía' }).click();

    // La región aria-live anuncia el mismo texto que el panel visual — se restringe a <p> para
    // no chocar con el `role="status"` (getByText por defecto encuentra ambos).
    await expect(pageA.locator('p', { hasText: '¡Has ganado!' })).toBeVisible();
    await expect(pageB.locator('p', { hasText: 'Has perdido' })).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
