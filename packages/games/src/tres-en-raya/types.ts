export type Cell = 0 | 1 | null;

export type TicTacToeVariant = 'classic' | 'moving';

export interface Winner {
  seat: 0 | 1;
  line: readonly [number, number, number];
}

export interface TicTacToeState {
  board: Cell[];
  turn: 0 | 1;
  winner: Winner | null;
  variant: TicTacToeVariant;
  /** Movimientos totales aplicados — solo se usa como tope anti-partida-infinita en la variante 'moving'. */
  moveCount: number;
}

/** 'classic': coloca en una casilla vacía. 'moving' (tras las 3 primeras fichas): mueve una ficha propia a una casilla vacía. */
export type TicTacToeMove = { cell: number } | { from: number; to: number };

/** Información perfecta: la vista es idéntica para ambos asientos y para espectadores. */
export type TicTacToeView = TicTacToeState;
