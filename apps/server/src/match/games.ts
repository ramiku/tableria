import type { GameDefinition } from '@tableria/engine';
import { gameDefinitions, type GameId } from '@tableria/games';

/**
 * `gameDefinitions` está tipado por juego (`GameDefinition<TicTacToeState,...>`),
 * pero el runtime del servidor maneja partidas de cualquier juego por `gameId`
 * en tiempo de ejecución, sin conocer su tipo de estado concreto. El cast vía
 * `unknown` es el escape hatch deliberado de este registro type-erased: la
 * corrección se mantiene porque cada matchId siempre se resuelve contra el
 * mismo GameDefinition con el que se creó, nunca se mezclan entre sí.
 */
export function getGameDefinition(gameId: string): GameDefinition<unknown, unknown> | undefined {
  if (Object.hasOwn(gameDefinitions, gameId)) {
    return gameDefinitions[gameId as GameId] as unknown as GameDefinition<unknown, unknown>;
  }
  return undefined;
}
