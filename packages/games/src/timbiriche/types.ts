export type BoardPreset = '8x8' | '9x9' | '10x10';

export const BOARD_PRESETS: Record<BoardPreset, { rows: number; cols: number }> = {
  '8x8': { rows: 8, cols: 8 },
  '9x9': { rows: 9, cols: 9 },
  '10x10': { rows: 10, cols: 10 },
};

export const DEFAULT_BOARD_PRESET: BoardPreset = '8x8';

/**
 * Una casilla `(r,c)` tiene 4 lados: `hEdges[r][c]` (arriba), `hEdges[r+1][c]` (abajo),
 * `vEdges[r][c]` (izquierda), `vEdges[r][c+1]` (derecha). `hEdges` mide `(rows+1) x cols`,
 * `vEdges` mide `rows x (cols+1)`. El valor es el asiento que trazó esa arista, o `null`.
 */
export interface TimbiricheState {
  /** Tamaño elegido al crear la mesa (variante) — fijo durante toda la partida. */
  rows: number;
  cols: number;
  hEdges: (number | null)[][];
  vEdges: (number | null)[][];
  boxOwner: (number | null)[][];
  /** Puntuación (casillas ganadas) por asiento. */
  scores: number[];
  turnSeat: number;
}

export type TimbiricheMove = { orientation: 'h' | 'v'; row: number; col: number };

/** Información perfecta: la vista es idéntica para todos los asientos y espectadores. */
export type TimbiricheView = TimbiricheState;
