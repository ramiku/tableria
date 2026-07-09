import { createRng } from '@tableria/engine';
import { describe, expect, it } from 'vitest';
import { escobaDefinition } from './definition.js';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import type { EscobaCard, EscobaState } from './types.js';

function setupState(numPlayers = 2, variant?: string): EscobaState {
  return setup({ numPlayers, rng: createRng('escoba-test-seed'), options: variant ? { variant } : undefined });
}

function ctx(seat: number) {
  return { seat, now: new Date() };
}

function card(suit: EscobaCard['suit'], rank: EscobaCard['rank']): EscobaCard {
  return { suit, rank };
}

function play(cardIndex: number, captureIndices: number[] = []) {
  return { type: 'play' as const, cardIndex, captureIndices };
}

const CONTINUE = { type: 'continue' as const };

describe('setup', () => {
  it('reparte 3 cartas a cada jugador y 4 a la mesa; el resto queda en el mazo', () => {
    const state = setupState(2);
    expect(state.hands).toHaveLength(2);
    for (const hand of state.hands) expect(hand).toHaveLength(3);
    expect(state.table).toHaveLength(4);
    expect(state.deck).toHaveLength(40 - 4 - 3 * 2);
  });

  it('soporta de 2 a 4 jugadores repartiendo siempre 3 cartas y 4 en la mesa', () => {
    for (const n of [2, 3, 4]) {
      const state = setupState(n);
      expect(state.hands).toHaveLength(n);
      expect(state.table).toHaveLength(4);
      expect(state.deck).toHaveLength(40 - 4 - 3 * n);
    }
  });

  it('arranca en la mano 0, asiento 0, sin capturas ni puntuación todavía', () => {
    const state = setupState(3);
    expect(state.handIndex).toBe(0);
    expect(state.turn).toBe(0);
    expect(state.scores).toEqual([0, 0, 0]);
    expect(state.captured).toEqual([[], [], []]);
    expect(state.escobas).toEqual([0, 0, 0]);
    expect(state.lastCapturer).toBeNull();
    expect(state.phase).toBe('playing');
    expect(state.pendingConfirm).toEqual([]);
    expect(state.lastHandSummary).toBeNull();
  });

  it('pre-mezcla barajas suficientes para muchas manos sin necesitar más aleatoriedad', () => {
    const state = setupState(2);
    expect(state.futureHands.length).toBeGreaterThan(1);
    for (const deck of state.futureHands) expect(deck).toHaveLength(40);
  });

  it('usa 21 puntos por defecto si no se elige variante', () => {
    expect(setupState(2).targetScore).toBe(21);
  });

  it('respeta la puntuación objetivo elegida en el lobby (11, 21 o 31)', () => {
    expect(setupState(2, '11').targetScore).toBe(11);
    expect(setupState(2, '31').targetScore).toBe(31);
  });

  it('ignora una variante inválida y usa el valor por defecto', () => {
    expect(setupState(2, 'nope').targetScore).toBe(21);
  });
});

describe('validateMove', () => {
  it('rechaza mover fuera de turno', () => {
    const state = setupState(2);
    expect(validateMove(state, play(0), ctx(1))).toEqual({ ok: false, code: 'NOT_YOUR_TURN' });
  });

  it('rechaza un índice de carta fuera de la mano', () => {
    const state = setupState(2);
    expect(validateMove(state, play(3), ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('acepta jugar sin capturar (la carta se queda en la mesa)', () => {
    const state = setupState(2);
    expect(validateMove(state, play(0), ctx(0))).toEqual({ ok: true });
  });

  it('acepta una combinación de captura que suma exactamente 15', () => {
    const state: EscobaState = {
      ...setupState(2),
      table: [card('bastos', 7), card('copas', 2)],
      hands: [[card('oros', 6)], [card('espadas', 3)]],
    };
    // 6 (jugada) + 7 + 2 = 15
    expect(validateMove(state, play(0, [0, 1]), ctx(0))).toEqual({ ok: true });
  });

  it('rechaza una combinación que no suma 15', () => {
    const state: EscobaState = {
      ...setupState(2),
      table: [card('bastos', 7), card('copas', 2)],
      hands: [[card('oros', 6)], [card('espadas', 3)]],
    };
    expect(validateMove(state, play(0, [0]), ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('rechaza índices de mesa repetidos o fuera de rango', () => {
    const state: EscobaState = { ...setupState(2), table: [card('bastos', 7)] };
    expect(validateMove(state, play(0, [0, 0]), ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
    expect(validateMove(state, play(0, [5]), ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('rechaza jugar una carta mientras se espera confirmación de fin de mano', () => {
    const state: EscobaState = { ...setupState(2), phase: 'roundEnd', pendingConfirm: [0, 1] };
    expect(validateMove(state, play(0), ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('rechaza continuar fuera de la pausa de fin de mano', () => {
    const state = setupState(2);
    expect(validateMove(state, CONTINUE, ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
  });

  it('rechaza continuar de un asiento que ya no está pendiente', () => {
    const state: EscobaState = { ...setupState(2), phase: 'roundEnd', pendingConfirm: [1] };
    expect(validateMove(state, CONTINUE, ctx(0))).toEqual({ ok: false, code: 'NOT_YOUR_TURN' });
  });
});

describe('applyMove — captura', () => {
  it('captura las cartas indicadas y las suma (con la jugada) al montón del asiento', () => {
    const state: EscobaState = {
      ...setupState(2),
      table: [card('bastos', 7), card('copas', 2), card('espadas', 12)],
      hands: [[card('oros', 6)], [card('bastos', 1)]],
    };
    const next = applyMove(state, play(0, [0, 1]), ctx(0));
    expect(next.captured[0]).toEqual(expect.arrayContaining([card('oros', 6), card('bastos', 7), card('copas', 2)]));
    expect(next.captured[0]).toHaveLength(3);
    expect(next.table).toEqual([card('espadas', 12)]);
    expect(next.lastCapturer).toBe(0);
    expect(next.turn).toBe(1);
  });

  it('vaciar la mesa de un golpe cuenta como escoba', () => {
    const state: EscobaState = {
      ...setupState(2),
      table: [card('bastos', 7)],
      // Sota (10) vale 8 para sumar 15 junto al 7 de la mesa.
      hands: [[card('oros', 10)], [card('bastos', 1)]],
    };
    const next = applyMove(state, play(0, [0]), ctx(0));
    expect(next.table).toEqual([]);
    expect(next.escobas[0]).toBe(1);
  });

  it('jugar sin capturar deja la carta boca arriba en la mesa y no toca las capturas', () => {
    const state: EscobaState = {
      ...setupState(2),
      table: [card('bastos', 7)],
      hands: [[card('oros', 4)], [card('bastos', 1)]],
    };
    const next = applyMove(state, play(0), ctx(0));
    expect(next.table).toEqual([card('bastos', 7), card('oros', 4)]);
    expect(next.captured[0]).toEqual([]);
    expect(next.lastCapturer).toBeNull();
  });
});

describe('applyMove — reposición y fin de mano', () => {
  it('reparte 3 cartas más a cada jugador cuando las manos se vacían y aún queda mazo', () => {
    const state: EscobaState = {
      ...setupState(2),
      deck: [card('bastos', 2), card('bastos', 3), card('bastos', 4), card('copas', 2), card('copas', 3), card('copas', 4)],
      hands: [[card('oros', 4)], [card('espadas', 1)]],
      table: [card('bastos', 7)],
    };
    let next = applyMove(state, play(0), ctx(0));
    next = applyMove(next, play(0), ctx(1));
    expect(next.hands[0]).toHaveLength(3);
    expect(next.hands[1]).toHaveLength(3);
    expect(next.deck).toHaveLength(0);
  });

  it('al agotar mazo y manos, congela la mano hasta que todos confirmen, y solo entonces reparte otra', () => {
    const state: EscobaState = {
      ...setupState(2),
      deck: [],
      hands: [[card('oros', 4)], [card('espadas', 1)]],
      table: [card('bastos', 7)],
      captured: [[card('copas', 1)], []],
      escobas: [0, 0],
      lastCapturer: 0,
      scores: [0, 0],
    };
    let next = applyMove(state, play(0), ctx(0)); // no captura, mesa: [7, 4]
    next = applyMove(next, play(0), ctx(1)); // no captura, mano vacía y mazo vacío: fin de mano

    // Mesa completa (7, 4, 1 del propio seat1) barrida hacia el asiento 0 (último capturador antes
    // del cierre): 3 cartas capturadas frente a 0 → +1 "más cartas"; 1 oro (el 4) frente a 0 → +1 "más
    // oros".
    expect(next.scores).toEqual([2, 0]);
    expect(next.phase).toBe('roundEnd');
    expect(next.pendingConfirm).toEqual([0, 1]);
    expect(activePlayers(next)).toEqual([0, 1]);
    expect(next.lastHandSummary).toEqual({
      handPoints: [2, 0],
      cardsWinner: 0,
      orosWinner: 0,
      veloWinner: null,
      escobas: [0, 0],
    });
    // No se reparte nada todavía: la mano queda congelada esperando confirmación.
    expect(next.hands.every((h) => h.length === 0)).toBe(true);

    next = applyMove(next, CONTINUE, ctx(0));
    expect(next.phase).toBe('roundEnd'); // falta el asiento 1
    expect(next.pendingConfirm).toEqual([1]);

    next = applyMove(next, CONTINUE, ctx(1));
    // Ya confirmaron los dos: se reparte una mano nueva — el asiento que abre rota con el índice
    // de mano (handIndex 1 → abre el asiento 1) para que nadie salga siempre primero.
    expect(next.phase).toBe('playing');
    expect(next.pendingConfirm).toEqual([]);
    expect(next.hands.every((h) => h.length === 3)).toBe(true);
    expect(next.table).toHaveLength(4);
    expect(next.handIndex).toBe(1);
    expect(next.turn).toBe(1);
  });

  it('si el marcador acumulado llega a 21 en solitario, la partida termina sin pausa', () => {
    const state: EscobaState = {
      ...setupState(2),
      deck: [],
      // Sota (10) vale 8, cierra a 15 con el 7 de la mesa: captura + escoba (mesa queda vacía).
      hands: [[card('oros', 10)], [card('espadas', 1)]],
      table: [card('bastos', 7)],
      captured: [[], []],
      escobas: [0, 0],
      lastCapturer: null,
      scores: [20, 10],
    };
    let next = applyMove(state, play(0, [0]), ctx(0));
    next = applyMove(next, play(0), ctx(1));

    // +1 cartas, +1 oros, +1 escoba sobre los 20 previos → 23, en solitario por encima de 21.
    expect(next.scores[0]).toBe(23);
    expect(activePlayers(next)).toEqual([]);
    const end = checkEnd(next)!;
    expect(end.ranking[0]).toEqual({ seat: 0, placement: 1, result: 'win' });
  });

  it('un empate igualando o superando 21 no termina la partida: sigue tras confirmar todos', () => {
    const state: EscobaState = {
      ...setupState(2),
      deck: [],
      hands: [[card('oros', 4)], [card('espadas', 1)]],
      table: [],
      captured: [[], []],
      escobas: [0, 0],
      lastCapturer: null,
      scores: [21, 21],
    };
    // Ninguno captura nada en esta mano (0 puntos repartidos) — el empate a 21 se mantiene.
    let next = applyMove(state, play(0), ctx(0));
    next = applyMove(next, play(0), ctx(1));

    expect(next.scores).toEqual([21, 21]);
    expect(next.phase).toBe('roundEnd');
    expect(checkEnd(next)).toBeNull();

    next = applyMove(next, CONTINUE, ctx(0));
    next = applyMove(next, CONTINUE, ctx(1));
    expect(next.phase).toBe('playing');
    expect(activePlayers(next)).toEqual([1]); // se repartió mano nueva, abre el asiento 1
    expect(checkEnd(next)).toBeNull();
  });

  it('usa la puntuación objetivo configurada, no siempre 21', () => {
    const state: EscobaState = {
      ...setupState(2, '11'),
      deck: [],
      hands: [[card('oros', 10)], [card('espadas', 1)]],
      table: [card('bastos', 7)],
      captured: [[], []],
      escobas: [0, 0],
      lastCapturer: null,
      scores: [9, 5],
    };
    let next = applyMove(state, play(0, [0]), ctx(0));
    next = applyMove(next, play(0), ctx(1));

    expect(next.scores[0]).toBeGreaterThanOrEqual(11);
    expect(activePlayers(next)).toEqual([]);
    expect(checkEnd(next)).not.toBeNull();
  });
});

describe('activePlayers / checkEnd', () => {
  it('hay turno activo mientras la partida no ha terminado', () => {
    expect(activePlayers(setupState(2))).toEqual([0]);
    expect(checkEnd(setupState(2))).toBeNull();
  });

  it('activePlayers y checkEnd dependen del marcador contra el objetivo, no de mazo/manos vacíos', () => {
    const decided: EscobaState = { ...setupState(2), deck: [], hands: [[], []], scores: [25, 15] };
    expect(activePlayers(decided)).toEqual([]);
    expect(checkEnd(decided)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 2, result: 'lose' },
      ],
    });

    const notDecided: EscobaState = {
      ...setupState(2),
      deck: [],
      hands: [[], []],
      scores: [10, 8],
      phase: 'roundEnd',
      pendingConfirm: [1],
    };
    expect(activePlayers(notDecided)).toEqual([1]);
    expect(checkEnd(notDecided)).toBeNull();
  });
});

describe('playerView', () => {
  it('revela la mano propia y solo el recuento de las ajenas; mesa y puntuación son públicas', () => {
    const state = setupState(2);
    const view0 = playerView(state, 0);
    const spectatorView = playerView(state, null);

    expect(view0.hand).toEqual(state.hands[0]);
    expect(spectatorView.hand).toBeNull();
    expect(view0.handCounts).toEqual([3, 3]);
    expect(view0.table).toEqual(state.table);
    expect(view0.scores).toEqual(spectatorView.scores);
    expect(view0.deckCount).toBe(state.deck.length);
    expect(view0.targetScore).toBe(21);
    expect(view0.phase).toBe('playing');
  });
});

describe('onTurnTimeout', () => {
  it('auto-confirma en vez de forfeitar cuando alguien tarda en la pausa de fin de mano', () => {
    const state: EscobaState = { ...setupState(2), phase: 'roundEnd', pendingConfirm: [0, 1] };
    expect(escobaDefinition.onTurnTimeout!(state, 0)).toEqual({ type: 'move', move: { type: 'continue' } });
  });

  it('sigue forfeitando por timeout durante el juego normal', () => {
    const state = setupState(2);
    expect(escobaDefinition.onTurnTimeout!(state, 0)).toEqual({ type: 'forfeit' });
  });
});
