import type { GameDefinition } from '@tableria/engine';
import { activePlayers, applyMove, checkEnd, playerView, setup, TIMEOUT_POSITION, validateMove } from './logic.js';
import { moveSchema } from './moves.js';
import type { CronolitoMove, CronolitoState } from './types.js';

export const cronolitoDefinition: GameDefinition<CronolitoState, CronolitoMove> = {
  id: 'cronolito',
  minPlayers: 1,
  maxPlayers: 6,
  moveSchema,
  setup,
  activePlayers,
  validateMove,
  // Igual que Pista Única: quedarse dormido no debe tumbar la partida entera para el resto de
  // Arquitectos — cuesta una Paradoja igual que un intento real fallido, pero SIN intentar
  // colocar la carta en ningún sitio (TIMEOUT_POSITION es un centinela, no una posición real).
  onTurnTimeout: () => ({ type: 'move', move: { position: TIMEOUT_POSITION } }),
  applyMove,
  checkEnd,
  playerView,
  ui: {
    defaultTurnSeconds: 30,
    supportsRealtime: true,
  },
};
