import type { GameDefinition } from '@tableria/engine';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import { moveSchema } from './moves.js';
import type { ReversiMove, ReversiState } from './types.js';

export const reversiDefinition: GameDefinition<ReversiState, ReversiMove> = {
  id: 'reversi',
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
  },
};
