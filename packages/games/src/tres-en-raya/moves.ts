import { z } from 'zod';

export const moveSchema = z.object({
  cell: z.number().int().min(0).max(8),
});
