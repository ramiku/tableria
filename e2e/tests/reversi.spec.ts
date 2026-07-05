import { expect, test } from '@playwright/test';
import { registerViaUi, uniqueUsername } from './helpers.js';

test('dos jugadores abren una partida de reversi y las capturas se reflejan en vivo para ambos', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    const usernameA = uniqueUsername('e2erevA');
    const usernameB = uniqueUsername('e2erevB');
    await registerViaUi(pageA, usernameA);
    await registerViaUi(pageB, usernameB);

    // A crea la mesa (asiento 0 → oscuras, primer turno).
    await pageA.goto('/juegos/reversi');
    await pageA.getByRole('button', { name: 'Comenzar' }).click();
    const code = (await pageA.getByTestId('room-code').innerText()).trim();

    await pageA.goto(`/sala/${code}`);
    await pageB.goto(`/sala/${code}`);
    await pageA.getByRole('button', { name: 'Estoy listo' }).click();
    await pageB.getByRole('button', { name: 'Estoy listo' }).click();
    await pageA.waitForURL('**/partida/*');
    await pageB.waitForURL('**/partida/*');

    // Apertura estándar: las 4 fichas centrales cruzadas dejan una única jugada legal
    // resaltada en fila 3, columna 4 para las oscuras (asiento 0 = A).
    await expect(pageA.getByRole('button', { name: 'Fila 3, columna 4: jugada legal' })).toBeVisible();
    await pageA.getByRole('button', { name: 'Fila 3, columna 4: jugada legal' }).click();

    // La jugada captura la ficha clara en fila 4, columna 4 — se voltea a oscura para ambos.
    await expect(pageA.getByRole('button', { name: 'Fila 3, columna 4: tu ficha' })).toBeVisible();
    await expect(pageA.getByRole('button', { name: 'Fila 4, columna 4: tu ficha' })).toBeVisible();
    await expect(pageB.getByRole('button', { name: 'Fila 3, columna 4: ficha rival' })).toBeVisible();
    await expect(pageB.getByRole('button', { name: 'Fila 4, columna 4: ficha rival' })).toBeVisible();

    // Ahora le toca a B (claras): tiene jugadas legales resaltadas y puede capturar de vuelta.
    const legalForB = pageB.getByRole('button', { name: /jugada legal/ });
    await expect(legalForB.first()).toBeVisible();
    const legalLabel = (await legalForB.first().getAttribute('aria-label'))!;
    await legalForB.first().click();

    // El mismo movimiento, visto desde A, deja de estar disponible y pasa a mostrar la ficha de B.
    const [, row, col] = legalLabel.match(/Fila (\d+), columna (\d+)/)!;
    await expect(pageA.getByRole('button', { name: `Fila ${row}, columna ${col}: ficha rival` })).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
