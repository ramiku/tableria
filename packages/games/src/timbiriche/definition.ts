import type { GameDefinition } from '@tableria/engine';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import { moveSchema } from './moves.js';
import type { TimbiricheMove, TimbiricheState } from './types.js';

export const timbiricheDefinition: GameDefinition<TimbiricheState, TimbiricheMove> = {
  id: 'timbiriche',
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
    variants: [
      { id: '8x8', name: '8×8' },
      { id: '9x9', name: '9×9' },
      { id: '10x10', name: '10×10' },
    ],
  },
};
