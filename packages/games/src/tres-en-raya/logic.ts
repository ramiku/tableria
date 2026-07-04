import type { GameEndResult, MoveCtx, SetupCtx } from '@tableria/engine';
import { WIN_LINES } from './lines.js';
import type { Cell, TicTacToeMove, TicTacToeState, TicTacToeView } from './types.js';

function isBoardFull(board: Cell[]): boolean {
  return board.every((c) => c !== null);
}

export function setup(_ctx: SetupCtx): TicTacToeState {
  return { board: Array<Cell>(9).fill(null), turn: 0, winner: null };
}

export function activePlayers(state: TicTacToeState): number[] {
  if (state.winner || isBoardFull(state.board)) return [];
  return [state.turn];
}

export function validateMove(
  state: TicTacToeState,
  move: TicTacToeMove,
  ctx: MoveCtx,
): { ok: true } | { ok: false; code: string } {
  if (state.winner || isBoardFull(state.board)) return { ok: false, code: 'GAME_OVER' };
  if (ctx.seat !== state.turn) return { ok: false, code: 'NOT_YOUR_TURN' };
  if (state.board[move.cell] !== null) return { ok: false, code: 'CELL_TAKEN' };
  return { ok: true };
}

export function applyMove(
  state: TicTacToeState,
  move: TicTacToeMove,
  _ctx: MoveCtx,
): TicTacToeState {
  const board = [...state.board];
  board[move.cell] = state.turn;

  const line = WIN_LINES.find((l) => l.every((i) => board[i] === state.turn));
  if (line) {
    return { board, turn: state.turn, winner: { seat: state.turn, line } };
  }

  return { board, turn: state.turn === 0 ? 1 : 0, winner: null };
}

export function checkEnd(state: TicTacToeState): GameEndResult | null {
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

export function playerView(state: TicTacToeState, _playerIndex: number | null): TicTacToeView {
  return state;
}
