import { z } from 'zod';

// La mano nunca supera 3 cartas (reparto inicial; se repone tras cada baza mientras quede mazo).
export const moveSchema = z.object({ cardIndex: z.number().int().min(0).max(2) });
