import { expect, test, type Page } from '@playwright/test';
import { registerViaUi, uniqueUsername } from './helpers.js';

/** Misma estrategia determinista que tournament-swiss.spec.ts: rellena la primera casilla vacía en tu turno. */
async function playTicTacToeUntilResult(page: Page): Promise<void> {
  const result = page.locator('p', { hasText: /¡Has ganado!|Has perdido|Empate/ });
  const yourTurn = page.locator('p', { hasText: 'Te toca a ti' });
  for (let i = 0; i < 20; i++) {
    if (await result.first().isVisible().catch(() => false)) return;
    if (await yourTurn.isVisible().catch(() => false)) {
      const emptyCell = page.getByRole('button', { name: /: vacía$/ }).first();
      if (await emptyCell.isVisible().catch(() => false)) await emptyCell.click();
    }
    await page.waitForTimeout(300);
  }
  throw new Error('La partida de tres en raya no terminó a tiempo');
}

test('regresión: un torneo de eliminación directa de 2 jugadores sigue funcionando tras el refactor de swiss', async ({ browser }) => {
  test.setTimeout(45_000);
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    await registerViaUi(pageA, uniqueUsername('e2eteA'));
    await registerViaUi(pageB, uniqueUsername('e2eteB'));

    await pageA.goto('/torneos');
    await pageA.getByRole('button', { name: 'Crear torneo' }).click();
    const tournamentName = `Elim ${Date.now()}`;
    await pageA.getByLabel('Nombre').fill(tournamentName);
    await pageA.getByLabel('Juego').selectOption('tres-en-raya');
    // Formato por defecto ya es 'single_elim' — no hace falta tocar el selector.
    await pageA.getByRole('button', { name: 'Crear', exact: true }).click();
    await pageA.getByRole('link', { name: new RegExp(tournamentName) }).click();
    await pageA.waitForURL('**/torneos/*');
    const tournamentUrl = pageA.url();

    await pageB.goto(tournamentUrl);
    await pageB.getByRole('button', { name: 'Inscribirme' }).click();

    for (const page of [pageA, pageB]) {
      await page.reload();
      await page.getByRole('button', { name: 'Confirmarme' }).click();
    }

    await pageA.reload();
    await pageA.getByRole('button', { name: 'Iniciar torneo' }).click();
    await expect(pageA.getByText('En curso')).toBeVisible();

    for (const page of [pageA, pageB]) {
      await page.goto(tournamentUrl);
      await page.getByRole('link', { name: 'Ir a tu partida' }).click();
      await page.waitForURL('**/partida/*');
    }
    await Promise.all([playTicTacToeUntilResult(pageA), playTicTacToeUntilResult(pageB)]);

    await pageA.goto(tournamentUrl);
    await expect(pageA.getByText('Terminado')).toBeVisible({ timeout: 10_000 });
    await expect(pageA.getByText('Clasificación final')).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
