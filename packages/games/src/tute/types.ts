export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos';

/** Baraja española completa de 48 cartas (con 8 y 9, a diferencia de Brisca/Escoba). */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface TuteCard {
  suit: Suit;
  rank: Rank;
}

/** Resultado de una ronda ya jugada — lo que pinta el modal de resumen entre rondas. */
export interface TuteRoundSummary {
  /** Puntos de esta ronda (bazas + cantes) por GRUPO (pareja o individual, según `groupOf`). */
  groupPoints: number[];
  /** Grupo(s) que se llevan la ronda — vacío si empate (nadie suma ronda ganada). */
  winnerGroups: number[];
}

export interface TuteState {
  /** 4 = Tute por parejas; 3 = Tute Cabrón, cada uno a la suya. Ver `groupOf`. */
  numPlayers: number;
  /** Rondas ganadas necesarias para ganar la partida (1, 3 o 5, elegido en el lobby). */
  roundsToWin: number;
  /** Ronda en curso, 1-indexada. */
  roundNumber: number;
  /** Rondas ganadas hasta ahora por cada GRUPO — decide el fin de partida. */
  matchRoundsWon: number[];
  /** Barajas ya mezcladas para las rondas siguientes (solo `setup` puede tirar dados — ver
   * `SetupCtx.rng` — así que se pre-barajan todas las que puedan hacer falta de una vez). */
  futureDecks: TuteCard[][];
  trumpSuit: Suit;
  /** Se reparte la baraja entera de golpe — a diferencia de Brisca, aquí no hay mazo del que robar. */
  hands: TuteCard[][];
  currentTrick: (TuteCard | null)[];
  leadSeat: number;
  turn: number;
  /** Puntuación (bazas + cantes) de la RONDA EN CURSO, por grupo: 2 posiciones (parejas) con 4
   * jugadores, `numPlayers` posiciones (cada asiento el suyo) con 3 — ver `groupOf`. Se resetea
   * al repartir cada ronda nueva. */
  groupScores: number[];
  /** Palos ya cantados en la ronda en curso — cada palo (rey+caballo en mano) solo se puede cantar
   * una vez por ronda. Se resetea al repartir cada ronda nueva. */
  cantedSuits: Suit[];
  /** `roundEnd`: la ronda acabó y se congela el reparto de la siguiente hasta que todos los
   * asientos manden `continue` (ver `pendingConfirm`). No aplica en la última ronda: si esa ronda
   * ya decide la partida, no hay pausa — el estado queda listo para `checkEnd`. */
  phase: 'playing' | 'roundEnd';
  /** Asientos que aún no han confirmado seguir a la siguiente ronda — solo relevante en `roundEnd`. */
  pendingConfirm: number[];
  /** Desglose de la última ronda jugada, para el modal de resumen — null mientras se juega. */
  lastRoundSummary: TuteRoundSummary | null;
}

export type TuteMove =
  | {
      type: 'play';
      cardIndex: number;
      /** Cante opcional de rey+caballo del palo indicado, solo válido al abrir baza — ver `validateMove`. */
      cante?: Suit;
    }
  | { type: 'continue' };

export interface TutePlayerView {
  numPlayers: number;
  roundsToWin: number;
  roundNumber: number;
  matchRoundsWon: number[];
  hand: TuteCard[] | null;
  handCounts: number[];
  trumpSuit: Suit;
  currentTrick: (TuteCard | null)[];
  leadSeat: number;
  turn: number;
  groupScores: number[];
  cantedSuits: Suit[];
  phase: 'playing' | 'roundEnd';
  pendingConfirm: number[];
  lastRoundSummary: TuteRoundSummary | null;
}
