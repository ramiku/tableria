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
  // Como se puede votar y cambiar de voto en cualquier momento (ver `activePlayers`), TODOS los
  // asientos siguen "activos" durante toda la votación, hayan votado ya o no — así que el aviso
  // de tiempo agotado le llega también a quien ya votó. Para esos, reafirmar su propio voto es
  // un no-op (no le pisa la decisión); solo a quien nunca ha votado se le asigna uno por defecto,
  // para que un desconectado no bloquee la ronda para siempre.
  onTurnTimeout: (state, playerIndex) =>
    state.phase === 'roundEnd'
      ? { type: 'move', move: { type: 'continue' } }
      : { type: 'move', move: { type: 'vote', target: state.votes[playerIndex] ?? (playerIndex + 1) % state.numPlayers } },
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
