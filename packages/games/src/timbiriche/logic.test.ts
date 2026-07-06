import { createRng } from '@tableria/engine';
import { describe, expect, it } from 'vitest';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import type { TimbiricheState } from './types.js';

function setupState(numPlayers = 2, variant?: string): TimbiricheState {
  return setup({ numPlayers, rng: createRng('test-seed'), options: variant ? { variant } : undefined });
}

function ctx(seat: number) {
  return { seat, now: new Date() };
}

/** Tablero mínimo 1x1 (una sola casilla, 4 aristas) para probar el cierre de casilla sin ruido. */
function oneBoxState(numPlayers = 2, turnSeat = 0): TimbiricheState {
  return {
    rows: 1,
    cols: 1,
    hEdges: [[null], [null]],
    vEdges: [[null, null]],
    boxOwner: [[null]],
    scores: Array(numPlayers).fill(0),
    turnSeat,
  };
}

describe('setup', () => {
  it('arranca con la variante por defecto (8x8) y todo vacío', () => {
    const state = setupState();
    expect(state.rows).toBe(8);
    expect(state.cols).toBe(8);
    expect(state.hEdges).toHaveLength(9);
    expect(state.hEdges[0]).toHaveLength(8);
    expect(state.vEdges).toHaveLength(8);
    expect(state.vEdges[0]).toHaveLength(9);
    expect(state.scores).toEqual([0, 0]);
    expect(state.turnSeat).toBe(0);
  });

  it('respeta la variante elegida (10x10) y el número de jugadores', () => {
    const state = setupState(4, '10x10');
    expect(state.rows).toBe(10);
    expect(state.cols).toBe(10);
    expect(state.scores).toEqual([0, 0, 0, 0]);
  });
});

describe('validateMove', () => {
  it('rechaza mover fuera de turno', () => {
    const state = oneBoxState();
    expect(validateMove(state, { orientation: 'h', row: 0, col: 0 }, ctx(1))).toEqual({
      ok: false,
      code: 'NOT_YOUR_TURN',
    });
  });

  it('rechaza una arista fuera de rango', () => {
    const state = oneBoxState();
    expect(validateMove(state, { orientation: 'h', row: 5, col: 0 }, ctx(0))).toEqual({
      ok: false,
      code: 'OUT_OF_BOUNDS',
    });
  });

  it('rechaza una arista ya trazada', () => {
    let state = oneBoxState();
    state = applyMove(state, { orientation: 'h', row: 0, col: 0 }, ctx(0));
    expect(validateMove(state, { orientation: 'h', row: 0, col: 0 }, ctx(1))).toEqual({
      ok: false,
      code: 'EDGE_TAKEN',
    });
  });

  it('acepta una arista libre en turno', () => {
    const state = oneBoxState();
    expect(validateMove(state, { orientation: 'v', row: 0, col: 0 }, ctx(0))).toEqual({ ok: true });
  });
});

describe('applyMove — turno extra al completar casilla', () => {
  it('completar una casilla mantiene el turno del mismo asiento', () => {
    // Cada movimiento que no cierra casilla pasa el turno — se sigue a quien le toca
    // realmente en cada paso (no siempre el mismo asiento).
    let state = oneBoxState();
    state = applyMove(state, { orientation: 'h', row: 0, col: 0 }, ctx(state.turnSeat)); // arriba
    state = applyMove(state, { orientation: 'h', row: 1, col: 0 }, ctx(state.turnSeat)); // abajo
    state = applyMove(state, { orientation: 'v', row: 0, col: 0 }, ctx(state.turnSeat)); // izquierda
    expect(state.boxOwner[0]![0]).toBeNull();
    const closingSeat = state.turnSeat;

    // Cuarto lado: cierra la casilla y concede turno extra al mismo asiento que la cerró.
    state = applyMove(state, { orientation: 'v', row: 0, col: 1 }, ctx(closingSeat));
    expect(state.boxOwner[0]![0]).toBe(closingSeat);
    expect(state.scores[closingSeat]).toBe(1);
    expect(state.turnSeat).toBe(closingSeat);
  });

  it('un movimiento que no completa ninguna casilla pasa el turno', () => {
    const state = oneBoxState();
    const next = applyMove(state, { orientation: 'h', row: 0, col: 0 }, ctx(0));
    expect(next.turnSeat).toBe(1);
    expect(next.boxOwner[0]![0]).toBeNull();
  });

  it('una arista interior puede completar dos casillas a la vez', () => {
    // Rejilla 1x2: dos casillas comparten la arista vertical central (row 0, col 1).
    let state: TimbiricheState = {
      rows: 1,
      cols: 2,
      hEdges: [
        [0, 0],
        [0, 0],
      ],
      vEdges: [[0, null, 0]],
      boxOwner: [[null, null]],
      scores: [0, 0],
      turnSeat: 1,
    };
    state = applyMove(state, { orientation: 'v', row: 0, col: 1 }, ctx(1));
    expect(state.boxOwner).toEqual([[1, 1]]);
    expect(state.scores[1]).toBe(2);
    expect(state.turnSeat).toBe(1);
  });
});

describe('checkEnd / activePlayers', () => {
  it('sigue en juego mientras queden casillas libres', () => {
    const state = oneBoxState();
    expect(checkEnd(state)).toBeNull();
    expect(activePlayers(state)).toEqual([0]);
  });

  it('termina y declara ganador único cuando se reclaman todas las casillas (2 jugadores)', () => {
    const state: TimbiricheState = { ...oneBoxState(), boxOwner: [[0]], scores: [1, 0] };
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 2, result: 'lose' },
      ],
    });
    expect(activePlayers(state)).toEqual([]);
  });

  it('declara empate cuando dos asientos igualan la puntuación máxima (4 jugadores)', () => {
    const state: TimbiricheState = { ...oneBoxState(4), rows: 1, cols: 8, scores: [3, 3, 1, 1] };
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'draw' },
        { seat: 1, placement: 1, result: 'draw' },
        { seat: 2, placement: 3, result: 'lose' },
        { seat: 3, placement: 3, result: 'lose' },
      ],
    });
  });
});

describe('playerView', () => {
  it('es información perfecta, idéntica para cualquier asiento o espectador', () => {
    const state = oneBoxState();
    expect(playerView(state, 0)).toEqual(playerView(state, 1));
    expect(playerView(state, 0)).toEqual(playerView(state, null));
    expect(playerView(state, 0)).toEqual(state);
  });
});
