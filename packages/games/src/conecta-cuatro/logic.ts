import type { GameEndResult, MoveCtx, SetupCtx } from '@tableria/engine';
import {
  BOARD_PRESETS,
  DEFAULT_BOARD_PRESET,
  type BoardPreset,
  type Cell,
  type ConnectFourMove,
  type ConnectFourState,
  type ConnectFourView,
} from './types.js';

const DIRECTIONS: [number, number][] = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal ↘
  [1, -1], // diagonal ↙
];

function isBoardFull(board: Cell[]): boolean {
  return board.every((c) => c !== null);
}

/** Fila donde caería una ficha soltada en `column` (gravedad: la más baja libre), o -1 si la columna está llena. */
function lowestEmptyRow(board: Cell[], cols: number, rows: number, column: number): number {
  for (let row = rows - 1; row >= 0; row--) {
    if (board[row * cols + column] === null) return row;
  }
  return -1;
}

/** Busca 4+ en línea que pasen por (row, col) en las 4 orientaciones posibles. */
function findWinningLine(board: Cell[], cols: number, rows: number, row: number, col: number, seat: 0 | 1): number[] | null {
  for (const [dr, dc] of DIRECTIONS) {
    const line = [row * cols + col];

    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < rows && c >= 0 && c < cols && board[r * cols + c] === seat) {
      line.push(r * cols + c);
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < rows && c >= 0 && c < cols && board[r * cols + c] === seat) {
      line.push(r * cols + c);
      r -= dr;
      c -= dc;
    }

    if (line.length >= 4) return line;
  }
  return null;
}

export function setup(ctx: SetupCtx): ConnectFourState {
  const presetId = (ctx.options?.variant as BoardPreset | undefined) ?? DEFAULT_BOARD_PRESET;
  const { rows, cols } = BOARD_PRESETS[presetId] ?? BOARD_PRESETS[DEFAULT_BOARD_PRESET];
  return { rows, cols, board: Array<Cell>(rows * cols).fill(null), turn: 0, winner: null };
}

export function activePlayers(state: ConnectFourState): number[] {
  if (state.winner) return [];
  if (isBoardFull(state.board)) return [];
  return [state.turn];
}

export function validateMove(
  state: ConnectFourState,
  move: ConnectFourMove,
  ctx: MoveCtx,
): { ok: true } | { ok: false; code: string } {
  if (activePlayers(state).length === 0) return { ok: false, code: 'GAME_OVER' };
  if (ctx.seat !== state.turn) return { ok: false, code: 'NOT_YOUR_TURN' };
  if (move.column < 0 || move.column >= state.cols) return { ok: false, code: 'INVALID_MOVE' };
  if (lowestEmptyRow(state.board, state.cols, state.rows, move.column) === -1) return { ok: false, code: 'COLUMN_FULL' };
  return { ok: true };
}

export function applyMove(state: ConnectFourState, move: ConnectFourMove, _ctx: MoveCtx): ConnectFourState {
  const row = lowestEmptyRow(state.board, state.cols, state.rows, move.column);
  const board = [...state.board];
  board[row * state.cols + move.column] = state.turn;

  const line = findWinningLine(board, state.cols, state.rows, row, move.column, state.turn);
  if (line) {
    return { ...state, board, turn: state.turn, winner: { seat: state.turn, line } };
  }

  return { ...state, board, turn: state.turn === 0 ? 1 : 0, winner: null };
}

export function checkEnd(state: ConnectFourState): GameEndResult | null {
  if (state.winner) {
    const loser = state.winner.seat === 0 ? 1 : 0;
    return {
      ranking: [
        { seat: state.winner.seat, placement: 1, result: 'win' },
        { seat: loser, placement: 2, result: 'lose' },
      ],
    };
  }
  if (isBoardFull(state.board)) {
    return {
      ranking: [
        { seat: 0, placement: 1, result: 'draw' },
        { seat: 1, placement: 1, result: 'draw' },
      ],
    };
  }
  return null;
}

export function playerView(state: ConnectFourState, _playerIndex: number | null): ConnectFourView {
  return state;
}
