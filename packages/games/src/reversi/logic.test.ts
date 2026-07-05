import { createRng } from '@tableria/engine';
import { describe, expect, it } from 'vitest';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import { SIZE, type Cell, type ReversiState } from './types.js';

function setupState(): ReversiState {
  return setup({ numPlayers: 2, rng: createRng('test-seed') });
}

function ctx(seat: number) {
  return { seat, now: new Date() };
}

function cellOf(row: number, col: number): number {
  return row * SIZE + col;
}

function boardWith(cells: { row: number; col: number; seat: 0 | 1 }[]): Cell[] {
  const board = Array<Cell>(SIZE * SIZE).fill(null);
  for (const c of cells) board[cellOf(c.row, c.col)] = c.seat;
  return board;
}

describe('setup', () => {
  it('arranca con las 4 fichas centrales cruzadas y turno del asiento 0 (oscuras)', () => {
    const state = setupState();
    expect(state.board.filter((c) => c !== null)).toHaveLength(4);
    expect(state.board[cellOf(3, 3)]).toBe(1);
    expect(state.board[cellOf(3, 4)]).toBe(0);
    expect(state.board[cellOf(4, 3)]).toBe(0);
    expect(state.board[cellOf(4, 4)]).toBe(1);
    expect(state.turn).toBe(0);
    expect(state.passStreak).toBe(0);
  });
});

describe('validateMove', () => {
  it('rechaza mover fuera de turno', () => {
    const state = setupState();
    expect(validateMove(state, { type: 'place', cell: cellOf(2, 3) }, ctx(1))).toEqual({
      ok: false,
      code: 'NOT_YOUR_TURN',
    });
  });

  it('rechaza colocar en una celda ocupada', () => {
    const state = setupState();
    expect(validateMove(state, { type: 'place', cell: cellOf(3, 3) }, ctx(0))).toEqual({
      ok: false,
      code: 'INVALID_MOVE',
    });
  });

  it('rechaza colocar sin capturar ninguna línea', () => {
    const state = setupState();
    // Esquina: no captura nada desde la posición inicial.
    expect(validateMove(state, { type: 'place', cell: cellOf(0, 0) }, ctx(0))).toEqual({
      ok: false,
      code: 'INVALID_MOVE',
    });
  });

  it('acepta la apertura estándar de las oscuras', () => {
    const state = setupState();
    expect(validateMove(state, { type: 'place', cell: cellOf(2, 3) }, ctx(0))).toEqual({ ok: true });
  });

  it('rechaza pasar si hay jugadas legales disponibles', () => {
    const state = setupState();
    expect(validateMove(state, { type: 'pass' }, ctx(0))).toEqual({ ok: false, code: 'MUST_PLAY' });
  });

  it('exige pasar cuando el turno actual no tiene ninguna jugada legal', () => {
    // Tablero donde el asiento 0 no puede capturar nada en ningún hueco vacío.
    const board = boardWith([
      { row: 0, col: 0, seat: 0 },
      { row: 0, col: 1, seat: 0 },
    ]);
    const state: ReversiState = { board, turn: 0, passStreak: 0 };
    expect(validateMove(state, { type: 'place', cell: cellOf(0, 2) }, ctx(0))).toEqual({
      ok: false,
      code: 'MUST_PASS',
    });
    expect(validateMove(state, { type: 'pass' }, ctx(0))).toEqual({ ok: true });
  });

  it('rechaza cualquier movimiento si la partida ya acabó', () => {
    const board = Array<Cell>(SIZE * SIZE).fill(0);
    const state: ReversiState = { board, turn: 0, passStreak: 0 };
    expect(validateMove(state, { type: 'pass' }, ctx(0))).toEqual({ ok: false, code: 'GAME_OVER' });
  });
});

describe('applyMove', () => {
  it('voltea la línea capturada y pasa el turno', () => {
    const state = setupState();
    const next = applyMove(state, { type: 'place', cell: cellOf(2, 3) }, ctx(0));
    expect(next.board[cellOf(2, 3)]).toBe(0);
    expect(next.board[cellOf(3, 3)]).toBe(0); // era 1, capturada
    expect(next.board[cellOf(4, 4)]).toBe(1); // fuera de la línea, intacta
    expect(next.turn).toBe(1);
    expect(next.passStreak).toBe(0);
  });

  it('voltea simultáneamente en varias direcciones (horizontal y vertical a la vez)', () => {
    const board = boardWith([
      { row: 3, col: 1, seat: 0 }, // ancla horizontal a la izquierda
      { row: 3, col: 2, seat: 1 },
      { row: 3, col: 3, seat: 1 },
      { row: 1, col: 4, seat: 0 }, // ancla vertical arriba
      { row: 2, col: 4, seat: 1 },
    ]);
    const state: ReversiState = { board, turn: 0, passStreak: 0 };
    const next = applyMove(state, { type: 'place', cell: cellOf(3, 4) }, ctx(0));
    expect(next.board[cellOf(3, 2)]).toBe(0);
    expect(next.board[cellOf(3, 3)]).toBe(0);
    expect(next.board[cellOf(2, 4)]).toBe(0);
    expect(next.board[cellOf(3, 4)]).toBe(0);
  });

  it('un pase no mueve fichas, solo cambia turno y suma al streak', () => {
    const state = setupState();
    const next = applyMove(state, { type: 'pass' }, ctx(0));
    expect(next.board).toEqual(state.board);
    expect(next.turn).toBe(1);
    expect(next.passStreak).toBe(1);
  });

  it('colocar resetea el passStreak', () => {
    const state: ReversiState = { ...setupState(), passStreak: 1 };
    const next = applyMove(state, { type: 'place', cell: cellOf(2, 3) }, ctx(0));
    expect(next.passStreak).toBe(0);
  });
});

describe('checkEnd / activePlayers', () => {
  it('sigue en juego con tablero inicial', () => {
    const state = setupState();
    expect(checkEnd(state)).toBeNull();
    expect(activePlayers(state)).toEqual([0]);
  });

  it('termina por tablero lleno y cuenta discos', () => {
    const board = Array<Cell>(SIZE * SIZE).fill(0);
    board[0] = 1;
    const state: ReversiState = { board, turn: 0, passStreak: 0 };
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 2, result: 'lose' },
      ],
    });
    expect(activePlayers(state)).toEqual([]);
  });

  it('termina por dos pases consecutivos aunque el tablero no esté lleno', () => {
    const board = Array<Cell>(SIZE * SIZE).fill(null);
    board[0] = 0;
    board[1] = 0;
    board[2] = 1;
    const state: ReversiState = { board, turn: 0, passStreak: 2 };
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'win' },
        { seat: 1, placement: 2, result: 'lose' },
      ],
    });
  });

  it('declara empate con el mismo número de discos', () => {
    const board = Array<Cell>(SIZE * SIZE).fill(null);
    board[0] = 0;
    board[1] = 1;
    const state: ReversiState = { board, turn: 0, passStreak: 2 };
    expect(checkEnd(state)).toEqual({
      ranking: [
        { seat: 0, placement: 1, result: 'draw' },
        { seat: 1, placement: 1, result: 'draw' },
      ],
    });
  });
});

describe('playerView', () => {
  it('es información perfecta e incluye las jugadas legales del turno actual', () => {
    const state = setupState();
    const view = playerView(state, 0);
    expect(view).toEqual(playerView(state, 1));
    expect(view).toEqual(playerView(state, null));
    expect(view.legalMoves.sort((a, b) => a - b)).toEqual(
      [cellOf(2, 3), cellOf(3, 2), cellOf(4, 5), cellOf(5, 4)].sort((a, b) => a - b),
    );
  });

  it('no ofrece jugadas legales cuando la partida ya terminó', () => {
    const board = Array<Cell>(SIZE * SIZE).fill(0);
    const state: ReversiState = { board, turn: 0, passStreak: 0 };
    expect(playerView(state, 0).legalMoves).toEqual([]);
  });
});
