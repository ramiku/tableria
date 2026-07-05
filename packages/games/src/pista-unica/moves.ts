import { z } from 'zod';

export const moveSchema = z.union([
  z.object({ type: z.literal('clue'), word: z.string().min(1).max(30) }),
  z.object({ type: z.literal('guess'), word: z.string().min(1).max(30) }),
]);
