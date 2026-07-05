import type { GameDefinition } from '@tableria/engine';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import { moveSchema } from './moves.js';
import type { PistaUnicaMove, PistaUnicaState } from './types.js';

export const pistaUnicaDefinition: GameDefinition<PistaUnicaState, PistaUnicaMove> = {
  id: 'pista-unica',
  minPlayers: 3,
  maxPlayers: 8,
  moveSchema,
  setup,
  activePlayers,
  validateMove,
  applyMove,
  checkEnd,
  playerView,
  // Ronda cooperativa: nadie pierde el partido por ir lento, solo se rellena una pista/adivinanza en blanco.
  onTurnTimeout: (state) =>
    state.phase === 'clue'
      ? { type: 'move', move: { type: 'clue', word: '(sin pista)' } }
      : { type: 'move', move: { type: 'guess', word: '(sin adivinanza)' } },
  ui: {
    defaultTurnSeconds: 60,
    supportsRealtime: true,
  },
};
