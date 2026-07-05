import { createRng } from '@tableria/engine';
import { describe, expect, it } from 'vitest';
import { WIN_LINES } from './lines.js';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import type { TicTacToeState } from './types.js';

function setupState(): TicTacToeState {
  return setup({ numPlayers: 2, rng: createRng('test-seed') });
}

function ctx(seat: number) {
  return { seat, now: new Date() };
}

describe('setup', () => {
  it('arranca con tablero vacío, turno del asiento 0 y sin ganador', () => {
    const state = setupState();
    expect(state.board).toEqual(Array(9).fill(null));
    expect(state.turn).toBe(0);
    expect(state.winner).toBeNull();
  });
});

describe('validateMove', () => {
  it('rechaza mover fuera de turno', () => {
    const state = setupState();
    const r = validateMove(state, { cell: 0 }, ctx(1));
    expect(r).toEqual({ ok: false, code: 'NOT_YOUR_TURN' });
  });

  it('rechaza casilla ocupada', () => {
    let state = setupState();
    state = applyMove(state, { cell: 4 }, ctx(0));
    const r = validateMove(state, { cell: 4 }, ctx(1));
    expect(r).toEqual({ ok: false, code: 'CELL_TAKEN' });
  });

  it('rechaza cualquier movimiento si la partida ya acabó', () => {
    let state = setupState();
    // 0 gana la fila superior: 0,1,2
    state = applyMove(state, { cell: 0 }, ctx(0)); // X
    state = applyMove(state, { cell: 3 }, ctx(1)); // O
    state = applyMove(state, { cell: 1 }, ctx(0)); // X
    state = applyMove(state, { cell: 4 }, ctx(1)); // O
    state = applyMove(state, { cell: 2 }, ctx(0)); // X gana
    expect(state.winner).not.toBeNull();
    const r = validateMove(state, { cell: 5 }, ctx(1));
    expect(r).toEqual({ ok: false, code: 'GAME_OVER' });
  });

  it('acepta un movimiento válido', () => {
    const state = setupState();
    expect(validateMove(state, { cell: 0 }, ctx(0))).toEqual({ ok: true });
  });
});

describe('applyMove', () => {
  it('coloca la ficha del asiento correcto y alterna el turno', () => {
    const state = setupState();
    const next = applyMove(state, { cell: 4 }, ctx(0));
    expect(next.board[4]).toBe(0);
    expect(next.turn).toBe(1);
  });
});

describe.each(WIN_LINES.map((line, i) => [i, line] as const))(
  'línea de victoria #%i (%j)',
  (_i, line) => {
    it('fija winner con el asiento y la línea correctos', () => {
      let state = setupState();
      const others = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((c) => !line.includes(c));

      // Asiento 0 juega la línea ganadora; asiento 1 juega en cualquier otra casilla.
      for (let i = 0; i < line.length; i++) {
        state = applyMove(state, { cell: line[i]! }, ctx(0));
        if (i < line.length - 1) {
          state = applyMove(state, { cell: others[i]! }, ctx(1));
        }
      }

      expect(state.winner).not.toBeNull();
      expect(state.winner?.seat).toBe(0);
      expect([...state.winner!.line].sort()).toEqual([...line].sort());

      const end = checkEnd(state);
      expect(end).toEqual({
        ranking: [
          { seat: 0, placement: 1, result: 'win' },
          { seat: 1, placement: 2, result: 'lose' },
        ],
      });
    });
  },
);

describe('empate', () => {
  it('checkEnd da empate cuando el tablero se llena sin línea ganadora', () => {
    // Secuencia clásica que llena el tablero sin ninguna línea de WIN_LINES.
    // Tablero final:
    // X O X
    // X O O
    // O X X
    const moves: { cell: number; seat: 0 | 1 }[] = [
      { cell: 0, seat: 0 }, // X
      { cell: 1, seat: 1 }, // O
      { cell: 2, seat: 0 }, // X
      { cell: 4, seat: 1 }, // O
      { cell: 3, seat: 0 }, // X
      { cell: 5, seat: 1 }, // O
      { cell: 7, seat: 0 }, // X
      { cell: 6, seat: 1 }, // O
      { cell: 8, seat: 0 }, // X
    ];

    let state = setupState();
    for (const [idx, m] of moves.entries()) {
      const isLast = idx === moves.length - 1;
      state = applyMove(state, { cell: m.cell }, ctx(m.seat));
      if (!isLast) {
        expect(checkEnd(state)).toBeNull();
      }
    }

    expect(state.winner).toBeNull();
    expect(state.board.every((c) => c !== null)).toBe(true);
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'draw' },
        { seat: 1, placement: 1, result: 'draw' },
      ],
    });
  });
});

describe('activePlayers', () => {
  it('devuelve el asiento en turno mientras la partida sigue abierta', () => {
    const state = setupState();
    expect(activePlayers(state)).toEqual([0]);
  });

  it('devuelve [] cuando hay ganador', () => {
    let state = setupState();
    state = applyMove(state, { cell: 0 }, ctx(0));
    state = applyMove(state, { cell: 3 }, ctx(1));
    state = applyMove(state, { cell: 1 }, ctx(0));
    state = applyMove(state, { cell: 4 }, ctx(1));
    state = applyMove(state, { cell: 2 }, ctx(0));
    expect(activePlayers(state)).toEqual([]);
  });
});

describe('playerView', () => {
  it('es idéntica para asiento 0, asiento 1 y espectador (información perfecta)', () => {
    const state = setupState();
    expect(playerView(state, 0)).toEqual(playerView(state, 1));
    expect(playerView(state, 1)).toEqual(playerView(state, null));
  });
});

describe('variante "moving"', () => {
  function setupMoving(): TicTacToeState {
    return setup({ numPlayers: 2, rng: createRng('test-seed'), options: { variant: 'moving' } });
  }

  /**
   * Coloca las 3 fichas de cada asiento sin formar ninguna línea:
   * asiento 0 en 0,1,8 — asiento 1 en 3,6,7. Quedan libres 2, 4 y 5.
   * Tras esta secuencia le toca a 0, que ya tiene sus 3 fichas (fase de movimiento).
   */
  function placeWithoutWinning(): TicTacToeState {
    let state = setupMoving();
    state = applyMove(state, { cell: 0 }, ctx(0));
    state = applyMove(state, { cell: 3 }, ctx(1));
    state = applyMove(state, { cell: 1 }, ctx(0));
    state = applyMove(state, { cell: 6 }, ctx(1));
    state = applyMove(state, { cell: 8 }, ctx(0));
    state = applyMove(state, { cell: 7 }, ctx(1));
    return state;
  }

  it('arranca en variante moving y fase de colocación igual que la clásica', () => {
    const state = setupMoving();
    expect(state.variant).toBe('moving');
    expect(validateMove(state, { cell: 0 }, ctx(0))).toEqual({ ok: true });
  });

  it('tras colocar sus 3 fichas, un jugador debe mover en vez de colocar', () => {
    const state = placeWithoutWinning();
    expect(piecesOnBoardHelper(state.board, 0)).toBe(3);
    // Le toca a 0 y ya tiene sus 3 fichas: debe mover, no colocar.
    expect(validateMove(state, { cell: 2 }, ctx(0))).toEqual({ ok: false, code: 'INVALID_MOVE' });
    expect(validateMove(state, { from: 8, to: 2 }, ctx(0))).toEqual({ ok: true });
  });

  it('rechaza mover una ficha que no es propia', () => {
    const state = placeWithoutWinning();
    expect(validateMove(state, { from: 6, to: 2 }, ctx(0))).toEqual({ ok: false, code: 'NOT_YOUR_PIECE' });
  });

  it('rechaza mover a una casilla ocupada', () => {
    const state = placeWithoutWinning();
    expect(validateMove(state, { from: 8, to: 1 }, ctx(0))).toEqual({ ok: false, code: 'CELL_TAKEN' });
  });

  it('mover una ficha a la casilla ganadora fija winner', () => {
    let state = placeWithoutWinning();
    // 0 tiene 0 y 1 puestos: mover la ficha de 8 a 2 completa la línea 0,1,2.
    state = applyMove(state, { from: 8, to: 2 }, ctx(0));
    expect(state.winner).toEqual({ seat: 0, line: [0, 1, 2] });
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 2, result: 'lose' },
      ],
    });
  });

  it('declara empate al superar el tope de movimientos sin ganador', () => {
    let state = placeWithoutWinning();

    // Fase de movimiento: 0 mueve su ficha de 8 entre 8↔5 y 1 mueve la suya de 3 entre 3↔4,
    // sin tocar nunca la casilla 2 (formaría línea con 0,1) — combinación verificada sin líneas.
    let toggle0 = true;
    let toggle1 = true;
    while (checkEnd(state) === null) {
      const seat = state.turn;
      if (seat === 0) {
        state = applyMove(state, toggle0 ? { from: 8, to: 5 } : { from: 5, to: 8 }, ctx(0));
        toggle0 = !toggle0;
      } else {
        state = applyMove(state, toggle1 ? { from: 3, to: 4 } : { from: 4, to: 3 }, ctx(1));
        toggle1 = !toggle1;
      }
    }

    expect(state.winner).toBeNull();
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'draw' },
        { seat: 1, placement: 1, result: 'draw' },
      ],
    });
  });
});

function piecesOnBoardHelper(board: TicTacToeState['board'], seat: 0 | 1): number {
  return board.filter((c) => c === seat).length;
}
