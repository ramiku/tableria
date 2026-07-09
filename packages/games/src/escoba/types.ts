export type Suit = 'oros' | 'copas' | 'espadas' | 'bastos';

/** Baraja española de 40 cartas (sin 8 ni 9): 1(As), 2-7, 10(sota), 11(caballo), 12(rey). */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export interface EscobaCard {
  suit: Suit;
  rank: Rank;
}

/** Desglose de puntos de una mano ya jugada — lo que pinta el modal de resumen entre manos. */
export interface EscobaHandSummary {
  /** Puntos ganados en ESTA mano por cada asiento (suma de las categorías de abajo). */
  handPoints: number[];
  /** Asiento que se llevó el punto de "más cartas capturadas" — null si nadie (empate). */
  cardsWinner: number | null;
  /** Asiento que se llevó el punto de "más oros" — null si nadie (empate). */
  orosWinner: number | null;
  /** Asiento que capturó el 7 de oros ("el velo") — null si nadie lo capturó. */
  veloWinner: number | null;
  /** Escobas conseguidas por cada asiento en esta mano. */
  escobas: number[];
}

export interface EscobaState {
  numPlayers: number;
  /** Puntuación objetivo elegida en el lobby (11, 21 o 31) — se juegan manos hasta que alguien
   * la alcance o supere en solitario. */
  targetScore: number;
  /** Barajas ya mezcladas para las manos siguientes (solo `setup` puede tirar dados — ver
   * `SetupCtx.rng` — así que se pre-barajan todas las que puedan hacer falta de una vez). */
  futureHands: EscobaCard[][];
  /** Índice de la mano actual dentro de `futureHands` — también rota el asiento que abre cada mano. */
  handIndex: number;
  /** Mazo restante de la mano en curso (se reparten 3 cartas más a cada jugador cuando se agotan
   * las manos, mientras queden cartas aquí). */
  deck: EscobaCard[];
  hands: EscobaCard[][];
  /** Cartas boca arriba sobre la mesa, disponibles para capturar. */
  table: EscobaCard[];
  /** Cartas ya capturadas por cada asiento en la mano en curso. */
  captured: EscobaCard[][];
  /** Escobas (mesa vaciada de un golpe) conseguidas por cada asiento en la mano en curso. */
  escobas: number[];
  /** Último asiento que capturó algo en la mano en curso — se lleva las cartas sobrantes al agotarse. */
  lastCapturer: number | null;
  turn: number;
  /** Puntuación acumulada entre manos — esta es la que decide quién gana la partida. */
  scores: number[];
  /** `roundEnd`: la mano acabó y se congela el reparto de la siguiente hasta que todos los
   * asientos manden `continue` (ver `pendingConfirm`). No aplica en la última mano: si esa
   * mano ya decide la partida, no hay pausa — el estado queda listo para `checkEnd`. */
  phase: 'playing' | 'roundEnd';
  /** Asientos que aún no han confirmado seguir a la siguiente mano — solo relevante en `roundEnd`. */
  pendingConfirm: number[];
  /** Desglose de la última mano jugada, para el modal de resumen — null mientras se juega. */
  lastHandSummary: EscobaHandSummary | null;
}

export type EscobaMove =
  | {
      type: 'play';
      cardIndex: number;
      /** Índices dentro de `table` a capturar junto con la carta jugada (vacío = no captura, la
       * carta se queda boca arriba en la mesa). Deben sumar exactamente 15 junto al valor de la carta. */
      captureIndices: number[];
    }
  | { type: 'continue' };

/**
 * Vista por asiento: mano propia visible, el resto solo como recuento — igual que Brisca.
 * Mesa y capturas son siempre información pública (no hay nada que ocultar ahí).
 */
export interface EscobaPlayerView {
  numPlayers: number;
  targetScore: number;
  hand: EscobaCard[] | null;
  handCounts: number[];
  table: EscobaCard[];
  capturedCounts: number[];
  escobas: number[];
  scores: number[];
  turn: number;
  deckCount: number;
  phase: 'playing' | 'roundEnd';
  pendingConfirm: number[];
  lastHandSummary: EscobaHandSummary | null;
}
