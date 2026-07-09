export interface CronolitoEvent {
  id: number;
  /** Lo único visible ANTES de colocar la carta — nunca debe contener el año. */
  titulo: string;
  anio: number;
  descripcion: string;
}

/** Resultado de la última jugada resuelta (de cualquier asiento) — para el flash de "¡Paradoja!"
 * o "¡Correcto!" en el cliente. `timedOut` distingue una Paradoja automática por tiempo agotado
 * (nunca se intentó colocar la carta) de un intento real fallido. */
export interface CronolitoResolution {
  titulo: string;
  anio: number;
  correct: boolean;
  seat: number;
  timedOut: boolean;
}

export interface CronolitoState {
  numPlayers: number;
  /** Cartas por robar en orden de reparto; la próxima es el final del array (mismo idiom que
   * el resto de juegos de cartas del catálogo). */
  deck: CronolitoEvent[];
  /** La Línea del Tiempo — siempre ordenada cronológicamente, año ya revelado para todas. */
  timeline: CronolitoEvent[];
  /** Carta "en juego" este turno — su año se oculta al cliente en `playerView` hasta resolverse.
   * `null` únicamente cuando la partida ya ha terminado (mazo agotado). */
  currentCard: CronolitoEvent | null;
  /** Vidas restantes por asiento — empiezan en 3, cada Paradoja resta 1. */
  lives: number[];
  turn: number;
  /** Aciertos acumulados por asiento (desempate de ranking). */
  correctCount: number[];
  /** Asientos que se han quedado sin vidas, en el orden en que cayeron. */
  eliminationOrder: number[];
  /** `null` solo antes del primer movimiento. */
  lastResolution: CronolitoResolution | null;
}

export type CronolitoMove = {
  /** Posición en la Línea del Tiempo donde insertar la carta: 0 = extremo izquierdo (más antiguo),
   * `timeline.length` = extremo derecho (más reciente), cualquier valor intermedio = entre dos cartas.
   * `-1` es un valor reservado (ver `TIMEOUT_POSITION` en `logic.ts`): solo lo usa el timeout del
   * servidor para forzar una Paradoja automática, nunca un clic real del jugador. */
  position: number;
};

export interface CronolitoPlayerView {
  numPlayers: number;
  timeline: CronolitoEvent[];
  /** Solo el título — el año se revela al resolver la jugada (ver `lastResolution`). */
  currentCardTitle: string | null;
  lives: number[];
  turn: number;
  deckCount: number;
  correctCount: number[];
  lastResolution: CronolitoResolution | null;
}
