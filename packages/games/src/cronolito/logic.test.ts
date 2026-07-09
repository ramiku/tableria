import { createRng } from '@tableria/engine';
import { describe, expect, it } from 'vitest';
import { activePlayers, applyMove, checkEnd, playerView, setup, TIMEOUT_POSITION, validateMove } from './logic.js';
import type { CronolitoEvent, CronolitoState } from './types.js';

function setupState(numPlayers = 2): CronolitoState {
  return setup({ numPlayers, rng: createRng('cronolito-test-seed') });
}

function ctx(seat: number) {
  return { seat, now: new Date() };
}

function event(id: number, anio: number, titulo = `Evento ${id}`): CronolitoEvent {
  return { id, titulo, anio, descripcion: `Broma sobre ${titulo}` };
}

describe('setup', () => {
  it('arranca con una carta en la línea de tiempo y una carta en juego', () => {
    const state = setupState(2);
    expect(state.timeline).toHaveLength(1);
    expect(state.currentCard).not.toBeNull();
    expect(state.deck.length).toBeGreaterThan(0);
  });

  it('reparte 3 vidas a cada asiento y arranca en el asiento 0', () => {
    const state = setupState(3);
    expect(state.lives).toEqual([3, 3, 3]);
    expect(state.turn).toBe(0);
    expect(state.correctCount).toEqual([0, 0, 0]);
    expect(state.eliminationOrder).toEqual([]);
    expect(state.lastResolution).toBeNull();
  });

  it('soporta desde 1 jugador (solitario) hasta 6', () => {
    for (const n of [1, 2, 6]) {
      const state = setupState(n);
      expect(state.lives).toHaveLength(n);
    }
  });
});

describe('validateMove', () => {
  it('rechaza mover fuera de turno', () => {
    const state = setupState(2);
    expect(validateMove(state, { position: 0 }, ctx(1))).toEqual({ ok: false, code: 'NOT_YOUR_TURN' });
  });

  it('rechaza una posición fuera de rango de la línea de tiempo', () => {
    const state = setupState(2);
    expect(validateMove(state, { position: 5 }, ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('acepta cualquier posición dentro de rango (0..timeline.length)', () => {
    const state = setupState(2);
    expect(validateMove(state, { position: 0 }, ctx(0))).toEqual({ ok: true });
    expect(validateMove(state, { position: state.timeline.length }, ctx(0))).toEqual({ ok: true });
  });
});

describe('applyMove — colocación', () => {
  it('coloca la carta si la posición es cronológicamente correcta y suma un acierto', () => {
    const state: CronolitoState = {
      ...setupState(2),
      timeline: [event(1, 1000), event(2, 2000)],
      currentCard: event(3, 1500),
      deck: [event(4, 1800)],
    };
    const next = applyMove(state, { position: 1 }, ctx(0)); // entre 1000 y 2000
    expect(next.timeline).toEqual([event(1, 1000), event(3, 1500), event(2, 2000)]);
    expect(next.correctCount[0]).toBe(1);
    expect(next.lives).toEqual(state.lives); // sin penalización
    expect(next.lastResolution).toEqual({ titulo: 'Evento 3', anio: 1500, correct: true, seat: 0, timedOut: false });
    expect(next.currentCard).toEqual(event(4, 1800)); // roba la siguiente
  });

  it('descarta la carta y resta una vida si la posición no respeta el orden cronológico', () => {
    const state: CronolitoState = {
      ...setupState(2),
      timeline: [event(1, 1000), event(2, 2000)],
      currentCard: event(3, 1500),
      deck: [event(4, 1800)],
    };
    const next = applyMove(state, { position: 0 }, ctx(0)); // 1500 no puede ir antes que 1000
    expect(next.timeline).toEqual(state.timeline); // no se añade
    expect(next.lives[0]).toBe(state.lives[0]! - 1);
    expect(next.lastResolution).toEqual({ titulo: 'Evento 3', anio: 1500, correct: false, seat: 0, timedOut: false });
  });

  it('acepta colocar en el extremo derecho cuando la carta es la más reciente', () => {
    const state: CronolitoState = {
      ...setupState(2),
      timeline: [event(1, 1000), event(2, 2000)],
      currentCard: event(3, 2500),
      deck: [],
    };
    const next = applyMove(state, { position: 2 }, ctx(0));
    expect(next.timeline).toEqual([event(1, 1000), event(2, 2000), event(3, 2500)]);
  });

  it('pasa el turno al siguiente asiento con vidas, saltándose a los eliminados', () => {
    const state: CronolitoState = {
      ...setupState(3),
      timeline: [event(1, 1000)],
      currentCard: event(2, 500),
      deck: [event(3, 1200), event(4, 1300)],
      lives: [3, 0, 3], // el asiento 1 ya está eliminado
      turn: 0,
    };
    const next = applyMove(state, { position: 1 }, ctx(0)); // incorrecta (500 no puede ir después de 1000)
    expect(next.turn).toBe(2); // se salta el asiento 1, eliminado
  });
});

describe('timeout (TIMEOUT_POSITION) — nunca coloca una carta', () => {
  it('validateMove siempre acepta el centinela de timeout', () => {
    const state = setupState(2);
    expect(validateMove(state, { position: TIMEOUT_POSITION }, ctx(0))).toEqual({ ok: true });
  });

  it('cuenta como Paradoja automática sin tocar la línea de tiempo, incluso si la posición 0 habría sido correcta', () => {
    const state: CronolitoState = {
      ...setupState(2),
      timeline: [event(1, 1000), event(2, 2000)],
      // Esta carta SÍ sería correcta en la posición 0 (antes de 1000) — el timeout debe fallar
      // igualmente, sin intentar colocarla ahí ni en ningún otro sitio.
      currentCard: event(3, 500),
      deck: [event(4, 1800)],
    };
    const next = applyMove(state, { position: TIMEOUT_POSITION }, ctx(0));
    expect(next.timeline).toEqual(state.timeline); // sin cambios
    expect(next.lives[0]).toBe(state.lives[0]! - 1);
    expect(next.correctCount[0]).toBe(0);
    expect(next.lastResolution).toEqual({ titulo: 'Evento 3', anio: 500, correct: false, seat: 0, timedOut: true });
  });
});

describe('eliminación y fin de partida', () => {
  it('en solitario, quedarse sin vidas termina la partida en derrota', () => {
    const state: CronolitoState = {
      ...setupState(1),
      timeline: [event(1, 1000)],
      currentCard: event(2, 500),
      deck: [event(3, 1200)],
      lives: [1],
      turn: 0,
    };
    const next = applyMove(state, { position: 1 }, ctx(0)); // incorrecta: pierde la última vida
    expect(next.lives).toEqual([0]);
    expect(activePlayers(next)).toEqual([]);
    expect(checkEnd(next)).toEqual({ ranking: [{ seat: 0, placement: 1, result: 'lose' }] });
  });

  it('agotar el mazo con más de un superviviente es un final de éxito compartido', () => {
    const state: CronolitoState = {
      ...setupState(3),
      timeline: [event(1, 1000)],
      currentCard: event(2, 2000),
      deck: [],
      lives: [3, 1, 0],
      eliminationOrder: [2],
    };
    const next = applyMove(state, { position: 1 }, ctx(0)); // correcta, y ya no queda mazo
    expect(next.currentCard).toBeNull();
    expect(activePlayers(next)).toEqual([]);
    expect(checkEnd(next)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 1, result: 'win' },
        { seat: 2, placement: 2, result: 'lose' },
      ],
    });
  });

  it('en partidas de 2, perder la última vida termina la partida ya mismo y gana el otro (sin agotar el mazo)', () => {
    const state: CronolitoState = {
      ...setupState(2),
      timeline: [event(1, 1000)],
      currentCard: event(2, 500),
      deck: [event(3, 1200), event(4, 1300)], // quedan cartas de sobra — no debería hacer falta jugarlas
      lives: [1, 3],
      turn: 0,
    };
    const next = applyMove(state, { position: 1 }, ctx(0)); // incorrecta: el asiento 0 cae, el 1 gana ya
    expect(next.lives).toEqual([0, 3]);
    expect(next.currentCard).not.toBeNull(); // el mazo sigue lleno — el fin no depende de agotarlo
    expect(activePlayers(next)).toEqual([]);
    expect(checkEnd(next)).toEqual({
      ranking: [
        { seat: 0, placement: 2, result: 'lose' },
        { seat: 1, placement: 1, result: 'win' },
      ],
    });
  });

  it('en partidas de 3+, sigue hasta que solo queda uno con vidas, y quien resistió más rankea mejor', () => {
    const state: CronolitoState = {
      ...setupState(3),
      timeline: [event(1, 1000)],
      currentCard: event(2, 500),
      deck: [event(3, 1200)],
      lives: [3, 0, 1], // el asiento 1 ya cayó antes
      eliminationOrder: [1],
      turn: 2,
    };
    const next = applyMove(state, { position: 1 }, ctx(2)); // incorrecta: el asiento 2 cae ahora, el último
    expect(next.lives).toEqual([3, 0, 0]);
    expect(activePlayers(next)).toEqual([]);
    expect(checkEnd(next)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 3, result: 'lose' }, // cayó antes → peor puesto
        { seat: 2, placement: 2, result: 'lose' }, // resistió más → mejor puesto que el 1
      ],
    });
  });
});

describe('playerView', () => {
  it('oculta el año de la carta en juego hasta que se resuelve', () => {
    const state = setupState(2);
    const view = playerView(state, 0);
    expect(view.currentCardTitle).toBe(state.currentCard!.titulo);
    expect(view).not.toHaveProperty('currentCard');
    expect((view as unknown as { currentCard?: unknown }).currentCard).toBeUndefined();
  });

  it('revela año y acierto de la última jugada en lastResolution', () => {
    const state: CronolitoState = {
      ...setupState(2),
      timeline: [event(1, 1000)],
      currentCard: event(2, 500),
      deck: [event(3, 1500)],
    };
    const next = applyMove(state, { position: 0 }, ctx(0));
    const view = playerView(next, 1);
    expect(view.lastResolution).toEqual({ titulo: 'Evento 2', anio: 500, correct: true, seat: 0, timedOut: false });
  });

  it('la vista es la misma para cualquier asiento y para el espectador (no hay info oculta por jugador)', () => {
    const state = setupState(2);
    const view0 = playerView(state, 0);
    const view1 = playerView(state, 1);
    const spectatorView = playerView(state, null);
    expect(view0).toEqual(view1);
    expect(view0).toEqual(spectatorView);
  });
});
