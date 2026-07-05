export type Cell = 0 | 1 | null;

export const ROWS = 6;
export const COLS = 7;

export interface Winner {
  seat: 0 | 1;
  line: number[];
}

export interface ConnectFourState {
  /** `ROWS * COLS`, fila a fila; índice 0 = esquina superior izquierda. */
  board: Cell[];
  turn: 0 | 1;
  winner: Winner | null;
}

export type ConnectFourMove = { column: number };

/** Información perfecta: la vista es idéntica para ambos asientos y espectadores. */
export type ConnectFourView = ConnectFourState;
