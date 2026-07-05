import { z } from 'zod';
import { COLS } from './types.js';

export const moveSchema = z.object({ column: z.number().int().min(0).max(COLS - 1) });
