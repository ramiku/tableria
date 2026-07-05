import type { GameDefinition } from '@tableria/engine';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import { moveSchema } from './moves.js';
import type { BriscaMove, BriscaState } from './types.js';

export const briscaDefinition: GameDefinition<BriscaState, BriscaMove> = {
  id: 'brisca',
  minPlayers: 2,
  maxPlayers: 4,
  moveSchema,
  setup,
  activePlayers,
  validateMove,
  applyMove,
  checkEnd,
  playerView,
  onTurnTimeout: () => ({ type: 'forfeit' }),
  ui: {
    defaultTurnSeconds: 30,
    supportsRealtime: true,
  },
};
