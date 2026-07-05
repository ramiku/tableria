import { createRng } from '@tableria/engine';
import { describe, expect, it } from 'vitest';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import { COLS, ROWS, type Cell, type ConnectFourState } from './types.js';

function setupState(): ConnectFourState {
  return setup({ numPlayers: 2, rng: createRng('test-seed') });
}

function ctx(seat: number) {
  return { seat, now: new Date() };
}

function drop(state: ConnectFourState, column: number, seat: 0 | 1): ConnectFourState {
  return applyMove(state, { column }, ctx(seat));
}

/** Tablero vacío con algunas fichas ya colocadas directamente (para probar detección de líneas sin depender de la gravedad). */
function boardWith(cells: { row: number; col: number; seat: 0 | 1 }[]): Cell[] {
  const board = Array<Cell>(ROWS * COLS).fill(null);
  for (const c of cells) board[c.row * COLS + c.col] = c.seat;
  return board;
}

describe('setup', () => {
  it(`arranca con tablero ${ROWS}x${COLS} vacío, turno del asiento 0 y sin ganador`, () => {
    const state = setupState();
    expect(state.board).toEqual(Array(ROWS * COLS).fill(null));
    expect(state.turn).toBe(0);
    expect(state.winner).toBeNull();
  });
});

describe('validateMove', () => {
  it('rechaza mover fuera de turno', () => {
    const state = setupState();
    expect(validateMove(state, { column: 0 }, ctx(1))).toEqual({ ok: false, code: 'NOT_YOUR_TURN' });
  });

  it('rechaza columna llena', () => {
    const board = boardWith(
      Array.from({ length: ROWS }, (_, row) => ({ row, col: 0, seat: (row % 2) as 0 | 1 })),
    );
    const state: ConnectFourState = { board, turn: 0, winner: null };
    expect(validateMove(state, { column: 0 }, ctx(0))).toEqual({ ok: false, code: 'COLUMN_FULL' });
  });

  it('rechaza cualquier movimiento si la partida ya acabó', () => {
    const board = boardWith([
      { row: 5, col: 0, seat: 0 },
      { row: 5, col: 1, seat: 0 },
      { row: 5, col: 2, seat: 0 },
    ]);
    const state: ConnectFourState = { board, turn: 0, winner: { seat: 0, line: [0, 1, 2, 3] } };
    expect(validateMove(state, { column: 3 }, ctx(1))).toEqual({ ok: false, code: 'GAME_OVER' });
  });

  it('acepta un movimiento válido', () => {
    const state = setupState();
    expect(validateMove(state, { column: 3 }, ctx(0))).toEqual({ ok: true });
  });
});

describe('applyMove', () => {
  it('la ficha cae hasta la fila más baja libre de la columna y alterna el turno', () => {
    const state = setupState();
    const next = drop(state, 3, 0);
    expect(next.board[(ROWS - 1) * COLS + 3]).toBe(0);
    expect(next.turn).toBe(1);

    const next2 = drop(next, 3, 1);
    expect(next2.board[(ROWS - 2) * COLS + 3]).toBe(1);
  });
});

describe('líneas de victoria', () => {
  it('horizontal', () => {
    const board = boardWith([
      { row: 5, col: 0, seat: 0 },
      { row: 5, col: 1, seat: 0 },
      { row: 5, col: 2, seat: 0 },
    ]);
    const state: ConnectFourState = { board, turn: 0, winner: null };
    const next = drop(state, 3, 0);
    expect(next.winner?.seat).toBe(0);
    expect([...next.winner!.line].sort((a, b) => a - b)).toEqual([
      5 * COLS + 0,
      5 * COLS + 1,
      5 * COLS + 2,
      5 * COLS + 3,
    ]);
    expect(checkEnd(next)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 2, result: 'lose' },
      ],
    });
  });

  it('vertical', () => {
    const board = boardWith([
      { row: 5, col: 2, seat: 0 },
      { row: 4, col: 2, seat: 0 },
      { row: 3, col: 2, seat: 0 },
    ]);
    const state: ConnectFourState = { board, turn: 0, winner: null };
    const next = drop(state, 2, 0);
    expect(next.winner?.seat).toBe(0);
    expect([...next.winner!.line].sort((a, b) => a - b)).toEqual([
      2 * COLS + 2,
      3 * COLS + 2,
      4 * COLS + 2,
      5 * COLS + 2,
    ]);
  });

  it('diagonal ↘ (fila y columna crecen juntas)', () => {
    // Línea objetivo: (2,0)-(3,1)-(4,2)-(5,3). La última ficha (2,0) cae por
    // gravedad tras rellenar la columna 0 con 3 fichas de relleno del rival.
    const board = boardWith([
      { row: 5, col: 0, seat: 1 },
      { row: 4, col: 0, seat: 1 },
      { row: 3, col: 0, seat: 1 },
      { row: 3, col: 1, seat: 0 },
      { row: 4, col: 2, seat: 0 },
      { row: 5, col: 3, seat: 0 },
    ]);
    const state: ConnectFourState = { board, turn: 0, winner: null };
    const next = drop(state, 0, 0);
    expect(next.winner?.seat).toBe(0);
    expect([...next.winner!.line].sort((a, b) => a - b)).toEqual([
      2 * COLS + 0,
      3 * COLS + 1,
      4 * COLS + 2,
      5 * COLS + 3,
    ]);
  });

  it('diagonal ↙ (fila crece, columna decrece)', () => {
    // Línea objetivo: (2,3)-(3,2)-(4,1)-(5,0). La última ficha (2,3) cae por
    // gravedad tras rellenar la columna 3 con 3 fichas de relleno del rival.
    const board = boardWith([
      { row: 5, col: 3, seat: 1 },
      { row: 4, col: 3, seat: 1 },
      { row: 3, col: 3, seat: 1 },
      { row: 3, col: 2, seat: 0 },
      { row: 4, col: 1, seat: 0 },
      { row: 5, col: 0, seat: 0 },
    ]);
    const state: ConnectFourState = { board, turn: 0, winner: null };
    const next = drop(state, 3, 0);
    expect(next.winner?.seat).toBe(0);
    expect([...next.winner!.line].sort((a, b) => a - b)).toEqual([
      2 * COLS + 3,
      3 * COLS + 2,
      4 * COLS + 1,
      5 * COLS + 0,
    ]);
  });
});

describe('empate', () => {
  it('checkEnd da empate cuando el tablero se llena sin línea ganadora', () => {
    // value(row,col) definido como ((row + 2*col) mod 4) < 2 → periodo 2 en horizontal
    // y periodo 4 (racha máxima 2) en vertical y en ambas diagonales: nunca hay 4 en línea.
    const board = Array<Cell>(ROWS * COLS);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const r = (((row + 2 * col) % 4) + 4) % 4;
        board[row * COLS + col] = r < 2 ? 0 : 1;
      }
    }
    const state: ConnectFourState = { board, turn: 0, winner: null };
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
    expect(activePlayers(setupState())).toEqual([0]);
  });

  it('devuelve [] cuando hay ganador', () => {
    const board = boardWith([
      { row: 5, col: 0, seat: 0 },
      { row: 5, col: 1, seat: 0 },
      { row: 5, col: 2, seat: 0 },
    ]);
    const state: ConnectFourState = { board, turn: 0, winner: null };
    const next = drop(state, 3, 0);
    expect(activePlayers(next)).toEqual([]);
  });
});

describe('playerView', () => {
  it('es idéntica para asiento 0, asiento 1 y espectador (información perfecta)', () => {
    const state = setupState();
    expect(playerView(state, 0)).toEqual(playerView(state, 1));
    expect(playerView(state, 1)).toEqual(playerView(state, null));
  });
});
