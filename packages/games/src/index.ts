import { ticTacToeDefinition } from './tres-en-raya/definition.js';

export const gameDefinitions = {
  'tres-en-raya': ticTacToeDefinition,
} as const;

export type GameId = keyof typeof gameDefinitions;

export type { TicTacToeMove, TicTacToeState, TicTacToeView, Cell, Winner } from './tres-en-raya/types.js';
export { ticTacToeDefinition };
