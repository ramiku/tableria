/** Desglose de una ronda ya resuelta — lo que pinta el modal de resumen entre rondas. */
export interface ImpostorRoundSummary {
  impostor: number;
  secretWord: string;
  /** Voto emitido por cada asiento (a quién acusó). */
  votes: number[];
  /** Asiento más votado — el que el grupo decidió acusar. */
  accused: number;
  /** `accused === impostor`. */
  caught: boolean;
  /** Puntos ganados esta ronda por cada asiento (0 para casi todos salvo el bando ganador). */
  pointsAwarded: number[];
}

export interface ImpostorState {
  numPlayers: number;
  /** Rondas totales de la partida (5, 9 o 15, elegido en el lobby). */
  totalRounds: number;
  /** Ronda en curso, 0-indexada. */
  round: number;
  /** Impostor de cada ronda, sorteado entero en `setup` (solo ahí hay `rng`). */
  impostors: number[];
  /** Palabra secreta de cada ronda, sorteada entera en `setup`, sin repetirse en la partida. */
  words: string[];
  /** = `impostors[round]` — se guarda aparte para no repetir el índice en cada sitio. */
  impostor: number;
  /** = `words[round]`. */
  secretWord: string;
  /** `voting`: clasificación en vivo, se puede votar y cambiar de voto en cualquier momento.
   * `roundEnd`: pausa de resumen, hay que confirmar para repartir la siguiente ronda — igual que
   * Brisca/Tute/Escoba entre rondas. */
  phase: 'voting' | 'roundEnd';
  /** Voto EN CURSO de cada asiento — visible en tiempo real para todos según se vota, y se puede
   * cambiar libremente mientras se siga en `voting` (no hay "ronda de votación" que resetee esto:
   * solo se limpia al repartir la siguiente ronda). `null` = todavía no ha votado nunca esta ronda. */
  votes: (number | null)[];
  /** Todos han votado al menos una vez y el más votado está empatado — la clasificación se queda
   * a la vista tal cual y cualquiera puede cambiar su voto para desempatar (en vez de resetear la
   * votación entera). */
  tied: boolean;
  /** Puntuación acumulada entre rondas — decide el ranking final de la partida. */
  scores: number[];
  /** Asientos que aún no han confirmado seguir a la siguiente ronda — solo relevante en `roundEnd`. */
  pendingConfirm: number[];
  /** Desglose de la última ronda resuelta, para el modal de resumen — `null` mientras se vota
   * por primera vez (antes de que se resuelva ninguna ronda). */
  lastRoundSummary: ImpostorRoundSummary | null;
}

export type ImpostorMove = { type: 'vote'; target: number } | { type: 'continue' };

/**
 * Vista por asiento: cada uno solo sabe si ÉL es el impostor, nunca quién es el resto hasta que
 * la ronda se resuelve (`lastRoundSummary`) — ni siquiera espectadores, que podrían estar
 * compartiendo pantalla con el impostor. La palabra secreta solo llega a quien no es el impostor.
 * Los votos, en cambio, son públicos en tiempo real para todos — es la clasificación en vivo que
 * pide el juego, no hay nada que ocultar ahí.
 */
export interface ImpostorPlayerView {
  numPlayers: number;
  totalRounds: number;
  round: number;
  scores: number[];
  phase: 'voting' | 'roundEnd';
  amITheImpostor: boolean;
  /** `null` para el impostor y para espectadores mientras se vota. */
  secretWord: string | null;
  /** Voto en curso de cada asiento, igual que en el estado — público, en tiempo real. */
  votes: (number | null)[];
  tied: boolean;
  pendingConfirm: number[];
  lastRoundSummary: ImpostorRoundSummary | null;
}
