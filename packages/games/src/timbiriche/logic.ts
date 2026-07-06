import type { GameEndResult, MoveCtx, SetupCtx } from '@tableria/engine';
import { BOARD_PRESETS, DEFAULT_BOARD_PRESET, type BoardPreset, type TimbiricheMove, type TimbiricheState, type TimbiricheView } from './types.js';

function emptyGrid(rows: number, cols: number): (number | null)[][] {
  return Array.from({ length: rows }, () => Array<number | null>(cols).fill(null));
}

/** Casillas `[r, c]` a las que pertenece la arista de `move` (1 si es de borde, 2 si es interior). */
function adjacentBoxes(state: TimbiricheState, move: TimbiricheMove): [number, number][] {
  const { rows, cols } = state;
  if (move.orientation === 'h') {
    // hEdges[row][col] es el lado superior de la casilla (row, col) e inferior de (row-1, col).
    const boxes: [number, number][] = [];
    if (move.row > 0) boxes.push([move.row - 1, move.col]);
    if (move.row < rows) boxes.push([move.row, move.col]);
    return boxes;
  }
  // vEdges[row][col] es el lado izquierdo de la casilla (row, col) y derecho de (row, col-1).
  const boxes: [number, number][] = [];
  if (move.col > 0) boxes.push([move.row, move.col - 1]);
  if (move.col < cols) boxes.push([move.row, move.col]);
  return boxes;
}

function isBoxComplete(state: TimbiricheState, r: number, c: number): boolean {
  return (
    state.hEdges[r]?.[c] !== null &&
    state.hEdges[r + 1]?.[c] !== null &&
    state.vEdges[r]?.[c] !== null &&
    state.vEdges[r]?.[c + 1] !== null
  );
}

function inRange(state: TimbiricheState, move: TimbiricheMove): boolean {
  const { rows, cols } = state;
  if (move.orientation === 'h') return move.row >= 0 && move.row <= rows && move.col >= 0 && move.col < cols;
  return move.row >= 0 && move.row < rows && move.col >= 0 && move.col <= cols;
}

function edgeAt(state: TimbiricheState, move: TimbiricheMove): number | null {
  return move.orientation === 'h' ? (state.hEdges[move.row]?.[move.col] ?? null) : (state.vEdges[move.row]?.[move.col] ?? null);
}

export function setup(ctx: SetupCtx): TimbiricheState {
  const presetId = (ctx.options?.variant as BoardPreset | undefined) ?? DEFAULT_BOARD_PRESET;
  const { rows, cols } = BOARD_PRESETS[presetId] ?? BOARD_PRESETS[DEFAULT_BOARD_PRESET];
  return {
    rows,
    cols,
    hEdges: emptyGrid(rows + 1, cols),
    vEdges: emptyGrid(rows, cols + 1),
    boxOwner: emptyGrid(rows, cols),
    scores: Array(ctx.numPlayers).fill(0),
    turnSeat: 0,
  };
}

export function activePlayers(state: TimbiricheState): number[] {
  if (checkEnd(state)) return [];
  return [state.turnSeat];
}

export function validateMove(state: TimbiricheState, move: TimbiricheMove, ctx: MoveCtx): { ok: true } | { ok: false; code: string } {
  if (activePlayers(state).length === 0) return { ok: false, code: 'GAME_OVER' };
  if (ctx.seat !== state.turnSeat) return { ok: false, code: 'NOT_YOUR_TURN' };
  if (!inRange(state, move)) return { ok: false, code: 'OUT_OF_BOUNDS' };
  if (edgeAt(state, move) !== null) return { ok: false, code: 'EDGE_TAKEN' };
  return { ok: true };
}

export function applyMove(state: TimbiricheState, move: TimbiricheMove, ctx: MoveCtx): TimbiricheState {
  const hEdges = state.hEdges.map((row) => [...row]);
  const vEdges = state.vEdges.map((row) => [...row]);
  const boxOwner = state.boxOwner.map((row) => [...row]);
  const scores = [...state.scores];

  // Las coordenadas ya se validaron en `validateMove` — están garantizadas dentro de rango.
  if (move.orientation === 'h') hEdges[move.row]![move.col] = ctx.seat;
  else vEdges[move.row]![move.col] = ctx.seat;

  const nextState: TimbiricheState = { ...state, hEdges, vEdges, boxOwner, scores };

  let completedAny = false;
  for (const [r, c] of adjacentBoxes(state, move)) {
    if (boxOwner[r]![c] === null && isBoxComplete(nextState, r, c)) {
      boxOwner[r]![c] = ctx.seat;
      scores[ctx.seat]!++;
      completedAny = true;
    }
  }

  nextState.turnSeat = completedAny ? ctx.seat : (state.turnSeat + 1) % state.scores.length;
  return nextState;
}

export function checkEnd(state: TimbiricheState): GameEndResult | null {
  const totalBoxes = state.rows * state.cols;
  const claimed = state.scores.reduce((sum, s) => sum + s, 0);
  if (claimed < totalBoxes) return null;

  const maxScore = Math.max(...state.scores);
  const winners = state.scores.filter((s) => s === maxScore).length;

  const ranking = state.scores.map((score, seat) => {
    const placement = 1 + state.scores.filter((s) => s > score).length;
    const result = placement !== 1 ? 'lose' : winners > 1 ? 'draw' : 'win';
    return { seat, placement, result: result as 'win' | 'lose' | 'draw' };
  });

  return { ranking };
}

export function playerView(state: TimbiricheState, _playerIndex: number | null): TimbiricheView {
  return state;
}
