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
  // En la pausa entre rondas, quien tarde en confirmar se auto-confirma en vez de perder la
  // partida entera por no leer a tiempo el resumen de puntos.
  onTurnTimeout: (state) => (state.phase === 'roundEnd' ? { type: 'move', move: { type: 'continue' } } : { type: 'forfeit' }),
  ui: {
    defaultTurnSeconds: 30,
    supportsRealtime: true,
    variants: [
      { id: '1', name: 'A 1 ronda' },
      { id: '3', name: 'A 3 rondas' },
      { id: '5', name: 'A 5 rondas' },
    ],
  },
};
