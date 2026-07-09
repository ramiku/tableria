import type { GameDefinition } from '@tableria/engine';
import { activePlayers, applyMove, checkEnd, playerView, setup, validateMove } from '../tute/logic.js';
import { moveSchema } from '../tute/moves.js';
import type { TuteMove, TuteState } from '../tute/types.js';

/**
 * Variante de Tute para 3 jugadores, sin parejas — cada uno a la suya ("cabrón"). Reutiliza
 * íntegramente el motor de `../tute`: la única diferencia real de reglas es `numPlayers`, que ya
 * cambia el agrupamiento de puntuación (`groupOf`, en `tute/logic.ts`) de parejas a individual —
 * no hace falta un motor aparte para un cambio que el propio `setup()` ya resuelve solo.
 */
export const tuteCabronDefinition: GameDefinition<TuteState, TuteMove> = {
  id: 'tute-cabron',
  minPlayers: 3,
  maxPlayers: 3,
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
