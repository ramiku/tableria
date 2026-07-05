export type Phase = 'clue' | 'guess';

export interface RoundHistoryEntry {
  round: number;
  guesser: number;
  secretWord: string;
  /** Pistas de esa ronda por asiento (null en la posición del adivinador). */
  clues: (string | null)[];
  /** true = pista válida (única) y se mostró al adivinador; false = duplicada, descartada. */
  clueValid: (boolean | null)[];
  guess: string;
  correct: boolean;
}

export interface PistaUnicaState {
  numPlayers: number;
  /** Ronda actual, 0-indexada; también es el asiento que adivina esta ronda (cada jugador adivina una vez). */
  round: number;
  guesser: number;
  phase: Phase;
  /** Palabra secreta de la ronda en curso — nunca debe llegar a `playerView` para el adivinador ni espectadores. */
  secretWord: string;
  /** Una palabra por ronda futura, ya sorteada en `setup` (el motor no tiene RNG fuera de `setup`). Nunca sale en `playerView`. */
  words: string[];
  /** Pista por asiento de la ronda en curso; null = todavía no ha mandado la suya (o es el adivinador). */
  clues: (string | null)[];
  /** null mientras no se resuelve la ronda (fase 'clue'); true/false por asiento una vez resuelta. */
  clueValid: (boolean | null)[];
  score: number;
  history: RoundHistoryEntry[];
}

export type PistaUnicaMove = { type: 'clue'; word: string } | { type: 'guess'; word: string };

export interface PistaUnicaView {
  numPlayers: number;
  round: number;
  totalRounds: number;
  guesser: number;
  phase: Phase;
  /** Solo para quien no adivina esta ronda (y no para espectadores); null en cualquier otro caso. */
  secretWord: string | null;
  /** En fase 'clue': solo tu propia pista (resto null). En fase 'guess': todas, ya resueltas. */
  clues: (string | null)[];
  /** Igual que `clues`: null hasta que la ronda se resuelve. */
  clueValid: (boolean | null)[];
  /** Quién ya ha mandado su pista esta ronda, sin revelar el contenido (para ver progreso en vivo). */
  submitted: boolean[];
  score: number;
  history: RoundHistoryEntry[];
}
