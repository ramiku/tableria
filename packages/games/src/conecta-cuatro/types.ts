export type Cell = 0 | 1 | null;

export type BoardPreset = '6x7' | '8x8' | '9x9';

export const BOARD_PRESETS: Record<BoardPreset, { rows: number; cols: number }> = {
  '6x7': { rows: 6, cols: 7 },
  '8x8': { rows: 8, cols: 8 },
  '9x9': { rows: 9, cols: 9 },
};

export const DEFAULT_BOARD_PRESET: BoardPreset = '6x7';

export interface Winner {
  seat: 0 | 1;
  line: number[];
}

export interface ConnectFourState {
  /** Tamaño elegido al crear la mesa (variante) — fijo durante toda la partida. */
  rows: number;
  cols: number;
  /** `rows * cols`, fila a fila; índice 0 = esquina superior izquierda. */
  board: Cell[];
  turn: 0 | 1;
  winner: Winner | null;
}

export type ConnectFourMove = { column: number };

/** Información perfecta: la vista es idéntica para ambos asientos y espectadores. */
export type ConnectFourView = ConnectFourState;
