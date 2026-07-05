import { expect, test } from '@playwright/test';
import { registerViaUi, uniqueUsername } from './helpers.js';

test('dos jugadores eligen tablero 8x8 y completan una partida de Conecta 4 (tablero 3D)', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    const usernameA = uniqueUsername('e2ec4A');
    const usernameB = uniqueUsername('e2ec4B');
    await registerViaUi(pageA, usernameA);
    await registerViaUi(pageB, usernameB);

    // A crea la mesa eligiendo la variante 8x8 (por defecto sería 6x7).
    await pageA.goto('/juegos/conecta-cuatro');
    await pageA.getByRole('button', { name: '8×8' }).click();
    await pageA.getByRole('button', { name: 'Comenzar' }).click();
    const code = (await pageA.getByTestId('room-code').innerText()).trim();

    await pageA.goto(`/sala/${code}`);
    await pageB.goto(`/sala/${code}`);
    await expect(pageA.getByText('8×8')).toBeVisible();
    await pageA.getByRole('button', { name: 'Estoy listo' }).click();
    await pageB.getByRole('button', { name: 'Estoy listo' }).click();
    await pageA.waitForURL('**/partida/*');
    await pageB.waitForURL('**/partida/*');

    // El tablero 3D expone la misma capa accesible de siempre: 64 botones (8x8), uno por celda.
    await expect(pageA.locator('[role="grid"] button')).toHaveCount(64);

    // A (seat 0) gana en vertical en la columna 0 con la ayuda de B jugando siempre en la columna 1.
    // Clicar cualquier celda de una columna dispara la misma jugada (la ficha cae por gravedad),
    // así que basta con el índice 0/1 de la rejilla sin importar qué fila muestre ahora mismo.
    const cellsA = pageA.locator('[role="grid"] button');
    const cellsB = pageB.locator('[role="grid"] button');
    for (let i = 0; i < 4; i++) {
      await cellsA.nth(0).click();
      if (i < 3) await cellsB.nth(1).click();
    }

    await expect(pageA.locator('p', { hasText: '¡Has ganado!' })).toBeVisible();
    await expect(pageB.locator('p', { hasText: 'Has perdido' })).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
