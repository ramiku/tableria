import type { GameDefinition } from '@tableria/engine';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import { moveSchema } from './moves.js';
import type { EscobaMove, EscobaState } from './types.js';

export const escobaDefinition: GameDefinition<EscobaState, EscobaMove> = {
  id: 'escoba',
  minPlayers: 2,
  maxPlayers: 4,
  moveSchema,
  setup,
  activePlayers,
  validateMove,
  applyMove,
  checkEnd,
  playerView,
  // En la pausa entre manos, quien tarde en confirmar se auto-confirma en vez de perder la
  // partida entera por no leer a tiempo el resumen de puntos.
  onTurnTimeout: (state) => (state.phase === 'roundEnd' ? { type: 'move', move: { type: 'continue' } } : { type: 'forfeit' }),
  ui: {
    defaultTurnSeconds: 30,
    supportsRealtime: true,
    variants: [
      { id: '11', name: 'A 11 puntos' },
      { id: '21', name: 'A 21 puntos' },
      { id: '31', name: 'A 31 puntos' },
    ],
  },
};
