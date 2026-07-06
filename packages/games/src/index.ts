import { briscaDefinition } from './brisca/definition.js';
import { connectFourDefinition } from './conecta-cuatro/definition.js';
import { pistaUnicaDefinition } from './pista-unica/definition.js';
import { reversiDefinition } from './reversi/definition.js';
import { timbiricheDefinition } from './timbiriche/definition.js';
import { ticTacToeDefinition } from './tres-en-raya/definition.js';

export const gameDefinitions = {
  'tres-en-raya': ticTacToeDefinition,
  'conecta-cuatro': connectFourDefinition,
  brisca: briscaDefinition,
  reversi: reversiDefinition,
  'pista-unica': pistaUnicaDefinition,
  timbiriche: timbiricheDefinition,
} as const;

export type GameId = keyof typeof gameDefinitions;

export type { TicTacToeMove, TicTacToeState, TicTacToeView, Cell, Winner } from './tres-en-raya/types.js';
export { ticTacToeDefinition };

export type {
  BoardPreset as ConnectFourBoardPreset,
  ConnectFourMove,
  ConnectFourState,
  ConnectFourView,
  Winner as ConnectFourWinner,
} from './conecta-cuatro/types.js';
export { BOARD_PRESETS as CONNECT_FOUR_BOARD_PRESETS, DEFAULT_BOARD_PRESET as CONNECT_FOUR_DEFAULT_PRESET } from './conecta-cuatro/types.js';
export { connectFourDefinition };

export type { BriscaCard, BriscaMove, BriscaPlayerView, BriscaState, Rank as BriscaRank, Suit as BriscaSuit } from './brisca/types.js';
export { briscaDefinition };

export type { ReversiMove, ReversiState, ReversiView } from './reversi/types.js';
export { SIZE as REVERSI_SIZE } from './reversi/types.js';
export { reversiDefinition };

export type { PistaUnicaMove, PistaUnicaState, PistaUnicaView, RoundHistoryEntry as PistaUnicaHistoryEntry } from './pista-unica/types.js';
export { pistaUnicaDefinition };

export type {
  BoardPreset as TimbiricheBoardPreset,
  TimbiricheMove,
  TimbiricheState,
  TimbiricheView,
} from './timbiriche/types.js';
export { BOARD_PRESETS as TIMBIRICHE_BOARD_PRESETS, DEFAULT_BOARD_PRESET as TIMBIRICHE_DEFAULT_PRESET } from './timbiriche/types.js';
export { timbiricheDefinition };
