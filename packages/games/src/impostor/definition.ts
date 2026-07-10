import type { GameDefinition } from '@tableria/engine';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from './logic.js';
import { moveSchema } from './moves.js';
import type { ImpostorMove, ImpostorState } from './types.js';

export const impostorDefinition: GameDefinition<ImpostorState, ImpostorMove> = {
  id: 'impostor',
  minPlayers: 3,
  maxPlayers: 10,
  moveSchema,
  setup,
  activePlayers,
  validateMove,
  applyMove,
  checkEnd,
  playerView,
  onTurnTimeout: (state, playerIndex) =>
    state.phase === 'roundEnd'
      ? { type: 'move', move: { type: 'continue' } }
      : // Voto en blanco determinista (nunca hacia uno mismo) para no bloquear la partida a
        // quien se despiste — la charla de voz sigue siendo la que de verdad decide.
        { type: 'move', move: { type: 'vote', target: (playerIndex + 1) % state.numPlayers } },
  ui: {
    // Generoso a propósito: la ronda se decide hablando por voz, no escribiendo — hace falta
    // tiempo de sobra para discutir antes de que alguien tenga que votar a ciegas.
    defaultTurnSeconds: 90,
    supportsRealtime: true,
    variants: [
      { id: '5', name: '5 rondas' },
      { id: '9', name: '9 rondas' },
      { id: '15', name: '15 rondas' },
    ],
  },
};
