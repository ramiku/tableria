import { z } from 'zod';
import { SIZE } from './types.js';

export const moveSchema = z.union([
  z.object({ type: z.literal('place'), cell: z.number().int().min(0).max(SIZE * SIZE - 1) }),
  z.object({ type: z.literal('pass') }),
]);
