import { expect, test } from '@playwright/test';
import { registerViaUi, uniqueUsername } from './helpers.js';

test('3 jugadores juegan Pista Única: ronda normal con pistas simultáneas y ronda resuelta por timeout', async ({ browser }) => {
  test.setTimeout(60_000);
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const contextC = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  const pageC = await contextC.newPage();

  try {
    const usernameA = uniqueUsername('e2epuA');
    const usernameB = uniqueUsername('e2epuB');
    const usernameC = uniqueUsername('e2epuC');
    await registerViaUi(pageA, usernameA);
    await registerViaUi(pageB, usernameB);
    await registerViaUi(pageC, usernameC);

    // A crea la mesa (aforo por defecto = mínimo del juego = 3, justo lo que necesitamos).
    // Ritmo 15s: se reutiliza más abajo para probar el timeout sin alargar la prueba.
    await pageA.goto('/juegos/pista-unica');
    await pageA.getByRole('button', { name: '15s' }).click();
    await pageA.getByRole('button', { name: 'Comenzar' }).click();

    // B y C se unen pulsando "Unirse" desde la ficha del juego (ya no hay código que compartir).
    await pageB.goto('/juegos/pista-unica');
    await pageB.getByRole('button', { name: 'Unirse' }).first().click();
    await pageC.goto('/juegos/pista-unica');
    await pageC.getByRole('button', { name: 'Unirse' }).first().click();

    await pageA.waitForURL('**/sala/*');
    await pageB.waitForURL('**/sala/*');
    await pageC.waitForURL('**/sala/*');
    await pageA.getByRole('button', { name: 'Estoy listo' }).click();
    await pageB.getByRole('button', { name: 'Estoy listo' }).click();
    await pageC.getByRole('button', { name: 'Estoy listo' }).click();

    await pageA.waitForURL('**/partida/*');
    await pageB.waitForURL('**/partida/*');
    await pageC.waitForURL('**/partida/*');

    // --- Ronda 0: adivinador = asiento 0 = A. B y C ven la palabra secreta; A no. ---
    await expect(pageA.getByText('Eres quien adivina esta ronda')).toBeVisible();
    await expect(pageA.getByText('Palabra secreta')).not.toBeVisible();
    await expect(pageB.getByText('Palabra secreta')).toBeVisible();
    await expect(pageC.getByText('Palabra secreta')).toBeVisible();

    // B y C mandan su pista A LA VEZ (turnos simultáneos reales, no por turnos).
    await Promise.all([
      pageB.getByPlaceholder('Escribe tu pista (una palabra)').fill('pistaDeB'),
      pageC.getByPlaceholder('Escribe tu pista (una palabra)').fill('pistaDeC'),
    ]);
    await Promise.all([
      pageB.getByRole('button', { name: 'Enviar pista' }).click(),
      pageC.getByRole('button', { name: 'Enviar pista' }).click(),
    ]);

    // Con ambas pistas dentro (ninguna duplicada), la ronda pasa a fase de adivinanza para A.
    await expect(pageA.getByPlaceholder('Escribe tu adivinanza')).toBeVisible();
    await expect(pageA.getByText('pistaDeB')).toBeVisible();
    await expect(pageA.getByText('pistaDeC')).toBeVisible();
    // B y C, mientras tanto, ven las mismas pistas ya reveladas y esperan la adivinanza.
    await expect(pageB.getByText('Esperando a que adivine…')).toBeVisible();
    await expect(pageC.getByText('pistaDeB')).toBeVisible();

    await pageA.getByPlaceholder('Escribe tu adivinanza').fill('mi-respuesta');
    await pageA.getByRole('button', { name: 'Adivinar' }).click();

    // La ronda se resuelve y pasa a la ronda 1 (adivinador = asiento 1 = B) con el historial visible.
    await expect(pageA.getByText('Ronda 2 de 3')).toBeVisible();
    await expect(pageB.getByText('Eres quien adivina esta ronda')).toBeVisible();
    await expect(pageA.getByText('Historial de rondas')).toBeVisible();
    await expect(pageC.getByText(/adivinó "mi-respuesta"|se adivinó "mi-respuesta"/)).toBeVisible();

    // --- Ronda 1: adivinador = B. Ni A ni C mandan pista — se deja vencer el deadline de 15s. ---
    // El runtime debe forzar a AMBOS rezagados (no solo al primero de la lista) y pasar sola a
    // fase de adivinanza para B; sin esto, la partida se quedaría colgada esperando al segundo.
    await expect(pageA.getByPlaceholder('Escribe tu pista (una palabra)')).toBeVisible();
    await expect(pageB.getByPlaceholder('Escribe tu adivinanza')).toBeVisible({ timeout: 20_000 });

    // B (adivinador de esta ronda) todavía puede adivinar con normalidad tras el timeout forzado,
    // confirmando que el reloj de la nueva fase se rearmó bien (no quedó "pegado" a un deadline ya vencido).
    await pageB.getByPlaceholder('Escribe tu adivinanza').fill('cualquier-cosa');
    await pageB.getByRole('button', { name: 'Adivinar' }).click();
    await expect(pageB.getByText('Ronda 3 de 3')).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
    await contextC.close();
  }
});
