export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos';

/** Baraja española: 1(As), 2-7, 10(sota), 11(caballo), 12(rey) — 10 rangos × 4 palos = 40 cartas. */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export interface BriscaCard {
  suit: Suit;
  rank: Rank;
}

export interface BriscaState {
  numPlayers: number;
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
  points: number[];
}

export type BriscaMove = { cardIndex: number };

/**
 * Vista por asiento: información oculta real (a diferencia de tres-en-raya/conecta-cuatro).
 * `hand` solo se rellena para el propio asiento; el resto de manos son solo un recuento.
 */
export interface BriscaPlayerView {
  numPlayers: number;
  hand: BriscaCard[] | null;
  handCounts: number[];
  trumpSuit: Suit;
  trumpCard: BriscaCard;
  currentTrick: (BriscaCard | null)[];
  leadSeat: number;
  turn: number;
  points: number[];
  deckCount: number;
}
