export const MATCH_ERROR_CODES = [
  'NOT_YOUR_TURN',
  'INVALID_MOVE',
  'MATCH_NOT_FOUND',
  'MATCH_NOT_IN_GAME',
  'SEAT_NOT_FOUND',
  'UNAUTHORIZED',
  'MATCH_FULL',
  'ALREADY_JOINED',
  'BAD_CODE',
  'RATE_LIMITED',
] as const;

export type MatchErrorCode = (typeof MATCH_ERROR_CODES)[number];
