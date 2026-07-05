import { z } from 'zod';

export const moveSchema = z.union([
  z.object({ cell: z.number().int().min(0).max(8) }),
  z.object({ from: z.number().int().min(0).max(8), to: z.number().int().min(0).max(8) }),
]);
