export type Cell = 0 | 1 | null;

export interface Winner {
  seat: 0 | 1;
  line: readonly [number, number, number];
}

export interface TicTacToeState {
  board: Cell[];
  turn: 0 | 1;
  winner: Winner | null;
}

export interface TicTacToeMove {
  cell: number;
}

/** Información perfecta: la vista es idéntica para ambos asientos y para espectadores. */
export type TicTacToeView = TicTacToeState;
