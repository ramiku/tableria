import { briscaDefinition } from './brisca/definition.js';
import { connectFourDefinition } from './conecta-cuatro/definition.js';
import { reversiDefinition } from './reversi/definition.js';
import { ticTacToeDefinition } from './tres-en-raya/definition.js';

export const gameDefinitions = {
  'tres-en-raya': ticTacToeDefinition,
  'conecta-cuatro': connectFourDefinition,
  brisca: briscaDefinition,
  reversi: reversiDefinition,
} as const;

export type GameId = keyof typeof gameDefinitions;

export type { TicTacToeMove, TicTacToeState, TicTacToeView, Cell, Winner } from './tres-en-raya/types.js';
export { ticTacToeDefinition };

export type {
  ConnectFourMove,
  ConnectFourState,
  ConnectFourView,
  Winner as ConnectFourWinner,
} from './conecta-cuatro/types.js';
export { COLS as CONNECT_FOUR_COLS, ROWS as CONNECT_FOUR_ROWS } from './conecta-cuatro/types.js';
export { connectFourDefinition };

export type { BriscaCard, BriscaMove, BriscaPlayerView, BriscaState, Rank as BriscaRank, Suit as BriscaSuit } from './brisca/types.js';
export { briscaDefinition };

export type { ReversiMove, ReversiState, ReversiView } from './reversi/types.js';
export { SIZE as REVERSI_SIZE } from './reversi/types.js';
export { reversiDefinition };
