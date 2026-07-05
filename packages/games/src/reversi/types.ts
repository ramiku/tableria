export type Cell = 0 | 1 | null;

export const SIZE = 8;

export interface ReversiState {
  /** `SIZE * SIZE`, fila a fila; índice 0 = esquina superior izquierda. 0 = oscuras (mueven primero), 1 = claras. */
  board: Cell[];
  turn: 0 | 1;
  /** Pases consecutivos sin colocar ficha; 2 seguidos termina la partida (ningún bando puede mover). */
  passStreak: number;
}

export type ReversiMove = { type: 'place'; cell: number } | { type: 'pass' };

/** Información perfecta: la vista es idéntica para ambos asientos y espectadores, con las jugadas legales del turno actual para que la UI pinte los huecos válidos y sepa cuándo ofrecer "pasar". */
export interface ReversiView extends ReversiState {
  legalMoves: number[];
}
