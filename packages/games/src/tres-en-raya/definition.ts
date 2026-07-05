import type { GameDefinition } from '@tableria/engine';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import { moveSchema } from './moves.js';
import type { TicTacToeMove, TicTacToeState } from './types.js';

export const ticTacToeDefinition: GameDefinition<TicTacToeState, TicTacToeMove> = {
  id: 'tres-en-raya',
  minPlayers: 2,
  maxPlayers: 2,
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
      { id: 'classic', name: 'Clásico' },
      { id: 'moving', name: 'Mover fichas' },
    ],
  },
};
