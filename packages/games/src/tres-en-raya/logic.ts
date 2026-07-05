import type { GameEndResult, MoveCtx, SetupCtx } from '@tableria/engine';
import { WIN_LINES } from './lines.js';
import type { Cell, TicTacToeMove, TicTacToeState, TicTacToeVariant, TicTacToeView } from './types.js';

/**
 * Sin límite de piezas colocables, la variante 'moving' nunca llena el tablero, así que
 * no hay condición natural de empate — este tope es una salvaguarda pragmática (no una
 * regla oficial) para que la partida no pueda alargarse indefinidamente si ambos
 * jugadores solo mueven fichas sin buscar ganar. El timeout de turno (M2) ya cubre el
 * caso de que alguien deje de responder.
 */
const MOVING_DRAW_MOVE_CAP = 40;

function isBoardFull(board: Cell[]): boolean {
  return board.every((c) => c !== null);
}

function piecesOnBoard(board: Cell[], seat: 0 | 1): number {
  return board.filter((c) => c === seat).length;
}

/** En 'moving', un asiento pasa de colocar a mover en cuanto tiene sus 3 fichas en el tablero. */
function isMovingPhase(state: TicTacToeState, seat: 0 | 1): boolean {
  return state.variant === 'moving' && piecesOnBoard(state.board, seat) >= 3;
}

export function setup(ctx: SetupCtx): TicTacToeState {
  const variant: TicTacToeVariant = ctx.options?.variant === 'moving' ? 'moving' : 'classic';
  return { board: Array<Cell>(9).fill(null), turn: 0, winner: null, variant, moveCount: 0 };
}

export function activePlayers(state: TicTacToeState): number[] {
  if (state.winner) return [];
  if (state.variant === 'classic' && isBoardFull(state.board)) return [];
  if (state.variant === 'moving' && state.moveCount >= MOVING_DRAW_MOVE_CAP) return [];
  return [state.turn];
}

export function validateMove(
  state: TicTacToeState,
  move: TicTacToeMove,
  ctx: MoveCtx,
): { ok: true } | { ok: false; code: string } {
  if (activePlayers(state).length === 0) return { ok: false, code: 'GAME_OVER' };
  if (ctx.seat !== state.turn) return { ok: false, code: 'NOT_YOUR_TURN' };

  if (!isMovingPhase(state, state.turn)) {
    if (!('cell' in move)) return { ok: false, code: 'INVALID_MOVE' };
    if (state.board[move.cell] !== null) return { ok: false, code: 'CELL_TAKEN' };
    return { ok: true };
  }

  if (!('from' in move)) return { ok: false, code: 'INVALID_MOVE' };
  if (state.board[move.from] !== state.turn) return { ok: false, code: 'NOT_YOUR_PIECE' };
  if (state.board[move.to] !== null) return { ok: false, code: 'CELL_TAKEN' };
  return { ok: true };
}

export function applyMove(state: TicTacToeState, move: TicTacToeMove, _ctx: MoveCtx): TicTacToeState {
  const board = [...state.board];
  if ('cell' in move) {
    board[move.cell] = state.turn;
  } else {
    board[move.from] = null;
    board[move.to] = state.turn;
  }
  const moveCount = state.moveCount + 1;

  const line = WIN_LINES.find((l) => l.every((i) => board[i] === state.turn));
  if (line) {
    return { ...state, board, moveCount, winner: { seat: state.turn, line } };
  }

  return { ...state, board, moveCount, turn: state.turn === 0 ? 1 : 0 };
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
  const isDraw =
    (state.variant === 'classic' && isBoardFull(state.board)) ||
    (state.variant === 'moving' && state.moveCount >= MOVING_DRAW_MOVE_CAP);
  if (isDraw) {
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
