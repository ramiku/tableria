export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos';

/** Baraja española: 1(As), 2-7, 10(sota), 11(caballo), 12(rey) — 10 rangos × 4 palos = 40 cartas. */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export interface BriscaCard {
  suit: Suit;
  rank: Rank;
}

/** Resultado de una ronda ya jugada — lo que pinta el modal de resumen entre rondas. */
export interface BriscaRoundSummary {
  /** Puntos de baza conseguidos en ESTA ronda por cada asiento. */
  roundPoints: number[];
  /** Asiento(s) que se llevan la ronda — vacío si empate (nadie suma ronda ganada). */
  winnerSeats: number[];
}

export interface BriscaState {
  numPlayers: number;
  /** Rondas ganadas necesarias para ganar la partida (1, 3 o 5, elegido en el lobby). */
  roundsToWin: number;
  /** Ronda en curso, 1-indexada. */
  roundNumber: number;
  /** Rondas ganadas hasta ahora por cada asiento — decide el fin de partida. */
  matchPoints: number[];
  /** Barajas ya mezcladas para las rondas siguientes (solo `setup` puede tirar dados — ver
   * `SetupCtx.rng` — así que se pre-barajan todas las que puedan hacer falta de una vez). */
  futureDecks: BriscaCard[][];
  /** Mazo restante; el final del array es la próxima carta a robar. */
  deck: BriscaCard[];
  trumpSuit: Suit;
  /** Carta de triunfo destapada al repartir — se muestra siempre, aunque ya esté al fondo del mazo. */
  trumpCard: BriscaCard;
  hands: BriscaCard[][];
  /** Cartas jugadas en la baza actual, por asiento (null = todavía no ha jugado). */
  currentTrick: (BriscaCard | null)[];
  leadSeat: number;
  turn: number;
  /** Puntos de baza de la ronda EN CURSO — se resetea a 0 al repartir cada ronda nueva. */
  points: number[];
  /** `roundEnd`: la ronda acabó y se congela el reparto de la siguiente hasta que todos los
   * asientos manden `continue` (ver `pendingConfirm`). No aplica en la última ronda: si esa ronda
   * ya decide la partida, no hay pausa — el estado queda listo para `checkEnd`. */
  phase: 'playing' | 'roundEnd';
  /** Asientos que aún no han confirmado seguir a la siguiente ronda — solo relevante en `roundEnd`. */
  pendingConfirm: number[];
  /** Desglose de la última ronda jugada, para el modal de resumen — null mientras se juega. */
  lastRoundSummary: BriscaRoundSummary | null;
}

export type BriscaMove = { type: 'play'; cardIndex: number } | { type: 'continue' };

/**
 * Vista por asiento: información oculta real (a diferencia de tres-en-raya/conecta-cuatro).
 * `hand` solo se rellena para el propio asiento; el resto de manos son solo un recuento.
 */
export interface BriscaPlayerView {
  numPlayers: number;
  roundsToWin: number;
  roundNumber: number;
  matchPoints: number[];
  hand: BriscaCard[] | null;
  handCounts: number[];
  trumpSuit: Suit;
  trumpCard: BriscaCard;
  currentTrick: (BriscaCard | null)[];
  leadSeat: number;
  turn: number;
  points: number[];
  deckCount: number;
  phase: 'playing' | 'roundEnd';
  pendingConfirm: number[];
  lastRoundSummary: BriscaRoundSummary | null;
}
