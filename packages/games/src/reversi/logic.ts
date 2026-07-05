import type { GameEndResult, MoveCtx, SetupCtx } from '@tableria/engine';
import { SIZE, type Cell, type ReversiMove, type ReversiState, type ReversiView } from './types.js';

const DIRECTIONS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

/** Casillas que voltearía colocar `seat` en `cell`, o `[]` si no es una jugada legal (vacía + al menos una línea capturada). */
function flipsFor(board: Cell[], cell: number, seat: 0 | 1): number[] {
  if (board[cell] !== null) return [];
  const row = Math.floor(cell / SIZE);
  const col = cell % SIZE;
  const opponent = seat === 0 ? 1 : 0;
  const flips: number[] = [];

  for (const [dr, dc] of DIRECTIONS) {
    const line: number[] = [];
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c) && board[r * SIZE + c] === opponent) {
      line.push(r * SIZE + c);
      r += dr;
      c += dc;
    }
    if (line.length > 0 && inBounds(r, c) && board[r * SIZE + c] === seat) {
      flips.push(...line);
    }
  }

  return flips;
}

function legalMoves(board: Cell[], seat: 0 | 1): number[] {
  const moves: number[] = [];
  for (let cell = 0; cell < board.length; cell++) {
    if (flipsFor(board, cell, seat).length > 0) moves.push(cell);
  }
  return moves;
}

export function setup(_ctx: SetupCtx): ReversiState {
  const board = Array<Cell>(SIZE * SIZE).fill(null);
  const mid = SIZE / 2;
  board[(mid - 1) * SIZE + (mid - 1)] = 1;
  board[(mid - 1) * SIZE + mid] = 0;
  board[mid * SIZE + (mid - 1)] = 0;
  board[mid * SIZE + mid] = 1;
  return { board, turn: 0, passStreak: 0 };
}

export function activePlayers(state: ReversiState): number[] {
  if (checkEnd(state)) return [];
  return [state.turn];
}

export function validateMove(
  state: ReversiState,
  move: ReversiMove,
  ctx: MoveCtx,
): { ok: true } | { ok: false; code: string } {
  if (activePlayers(state).length === 0) return { ok: false, code: 'GAME_OVER' };
  if (ctx.seat !== state.turn) return { ok: false, code: 'NOT_YOUR_TURN' };

  const hasLegalMove = legalMoves(state.board, state.turn).length > 0;
  if (move.type === 'pass') {
    return hasLegalMove ? { ok: false, code: 'MUST_PLAY' } : { ok: true };
  }

  if (!hasLegalMove) return { ok: false, code: 'MUST_PASS' };
  if (flipsFor(state.board, move.cell, state.turn).length === 0) return { ok: false, code: 'INVALID_MOVE' };
  return { ok: true };
}

export function applyMove(state: ReversiState, move: ReversiMove, _ctx: MoveCtx): ReversiState {
  const nextTurn = state.turn === 0 ? 1 : 0;

  if (move.type === 'pass') {
    return { ...state, turn: nextTurn, passStreak: state.passStreak + 1 };
  }

  const flips = flipsFor(state.board, move.cell, state.turn);
  const board = [...state.board];
  board[move.cell] = state.turn;
  for (const flipped of flips) {
    board[flipped] = state.turn;
  }

  return { board, turn: nextTurn, passStreak: 0 };
}

export function checkEnd(state: ReversiState): GameEndResult | null {
  const isFull = state.board.every((c) => c !== null);
  if (!isFull && state.passStreak < 2) return null;

  const count0 = state.board.filter((c) => c === 0).length;
  const count1 = state.board.filter((c) => c === 1).length;

  if (count0 === count1) {
    return {
      ranking: [
        { seat: 0, placement: 1, result: 'draw' },
        { seat: 1, placement: 1, result: 'draw' },
      ],
    };
  }

  const winner = count0 > count1 ? 0 : 1;
  const loser = winner === 0 ? 1 : 0;
  return {
    ranking: [
      { seat: winner, placement: 1, result: 'win' },
      { seat: loser, placement: 2, result: 'lose' },
    ],
  };
}

export function playerView(state: ReversiState, _playerIndex: number | null): ReversiView {
  return { ...state, legalMoves: checkEnd(state) ? [] : legalMoves(state.board, state.turn) };
}
