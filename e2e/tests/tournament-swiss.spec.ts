import { expect, test, type Page } from '@playwright/test';
import { registerViaUi, uniqueUsername } from './helpers.js';

/**
 * Estrategia determinista e independiente de qué asiento (X/O) te toque: siempre
 * rellena la primera casilla vacía disponible cuando es tu turno. Con esta regla
 * simétrica en ambos lados, la partida siempre acaba en victoria de X hacia el
 * 7º movimiento (fila 0 y diagonal 2-4-6 completas) — nunca en bucle infinito.
 */
async function playTicTacToeUntilResult(page: Page): Promise<void> {
  const result = page.locator('p', { hasText: /¡Has ganado!|Has perdido|Empate/ });
  // La región aria-live (sr-only) duplica el mismo texto que el banner visible — hay que
  // acotar a <p> para no chocar en modo estricto con el `role="status"` (mismo criterio que
  // ya usa match.spec.ts para el texto de resultado).
  const yourTurn = page.locator('p', { hasText: 'Te toca a ti' });
  for (let i = 0; i < 20; i++) {
    if (await result.first().isVisible().catch(() => false)) return;
    const myTurn = await yourTurn.isVisible().catch(() => false);
    if (myTurn) {
      const emptyCell = page.getByRole('button', { name: /: vacía$/ }).first();
      if (await emptyCell.isVisible().catch(() => false)) await emptyCell.click();
    }
    await page.waitForTimeout(300);
  }
  throw new Error('La partida de tres en raya no terminó a tiempo');
}

async function finishActiveMatchIfAny(page: Page, tournamentUrl: string): Promise<void> {
  await page.goto(tournamentUrl);
  const goToMatch = page.getByRole('link', { name: 'Ir a tu partida' });
  // `.isVisible()` es una foto instantánea, sin reintentos — justo tras el `goto()` la página
  // puede seguir cargando los datos vía tRPC (todavía en su esqueleto de carga), así que hay que
  // esperar activamente un momento a que aparezca (o no) el enlace, no comprobarlo una sola vez.
  try {
    await goToMatch.waitFor({ state: 'visible', timeout: 5_000 });
  } catch {
    return; // no te toca jugar esta ronda (bye, o ya se resolvió tu partida)
  }
  await goToMatch.click();
  await page.waitForURL('**/partida/*');
  await playTicTacToeUntilResult(page);
}

test('torneo suizo de 4 jugadores: 2 rondas sin bye y clasificación final por puntos', async ({ browser }) => {
  test.setTimeout(60_000);
  const contexts = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext(), browser.newContext()]);
  const [pageA, pageB, pageC, pageD] = await Promise.all(contexts.map((c) => c.newPage()));

  try {
    const names = [uniqueUsername('e2etsA'), uniqueUsername('e2etsB'), uniqueUsername('e2etsC'), uniqueUsername('e2etsD')];
    await registerViaUi(pageA, names[0]!);
    await registerViaUi(pageB, names[1]!);
    await registerViaUi(pageC, names[2]!);
    await registerViaUi(pageD, names[3]!);

    // A crea el torneo suizo (queda inscrito automáticamente como organizador).
    await pageA.goto('/torneos');
    await pageA.getByRole('button', { name: 'Crear torneo' }).click();
    const tournamentName = `Suizo ${Date.now()}`;
    await pageA.getByLabel('Nombre').fill(tournamentName);
    await pageA.getByLabel('Juego').selectOption('tres-en-raya');
    await pageA.getByLabel('Formato').selectOption('swiss');
    await pageA.getByRole('button', { name: 'Crear', exact: true }).click();

    await pageA.getByRole('link', { name: new RegExp(tournamentName) }).click();
    await pageA.waitForURL('**/torneos/*');
    const tournamentUrl = pageA.url();

    // B, C y D se inscriben y los 4 confirman asistencia.
    await pageB.goto(tournamentUrl);
    await pageC.goto(tournamentUrl);
    await pageD.goto(tournamentUrl);
    await pageB.getByRole('button', { name: 'Inscribirme' }).click();
    await pageC.getByRole('button', { name: 'Inscribirme' }).click();
    await pageD.getByRole('button', { name: 'Inscribirme' }).click();

    for (const page of [pageA, pageB, pageC, pageD]) {
      await page.reload();
      await page.getByRole('button', { name: 'Confirmarme' }).click();
    }

    await pageA.reload();
    await pageA.getByRole('button', { name: 'Iniciar torneo' }).click();
    await expect(pageA.getByText('En curso')).toBeVisible();

    // Ronda 1 (4 jugadores, par → sin bye): las 2 partidas se resuelven en paralelo,
    // cada página descubre su propio emparejamiento por el enlace "Ir a tu partida".
    await Promise.all([pageA, pageB, pageC, pageD].map((p) => finishActiveMatchIfAny(p, tournamentUrl)));

    // Ronda 2: el runner ya debería haber reemparejado por puntos y generado la siguiente ronda.
    // `finishActiveMatchIfAny` deja a pageA en /partida/$id (su propia partida), no en el torneo.
    await pageA.goto(tournamentUrl);
    await expect(pageA.getByText('Ronda 2')).toBeVisible({ timeout: 15_000 });
    await Promise.all([pageA, pageB, pageC, pageD].map((p) => finishActiveMatchIfAny(p, tournamentUrl)));

    // Con solo 2 rondas para 4 jugadores, el torneo debe cerrarse solo y mostrar clasificación final.
    await pageA.goto(tournamentUrl);
    await expect(pageA.getByText('Terminado')).toBeVisible({ timeout: 15_000 });
    await expect(pageA.getByText('Clasificación final')).toBeVisible();
  } finally {
    await Promise.all(contexts.map((c) => c.close()));
  }
});
