import type { GameDefinition } from '@tableria/engine';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import { moveSchema } from './moves.js';
import type { ConnectFourMove, ConnectFourState } from './types.js';

export const connectFourDefinition: GameDefinition<ConnectFourState, ConnectFourMove> = {
  id: 'conecta-cuatro',
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
