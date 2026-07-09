import { z } from 'zod';

// La mano nunca supera 3 cartas (reparto inicial; se repone tras cada baza mientras quede mazo).
export const moveSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('play'), cardIndex: z.number().int().min(0).max(2) }),
  // Confirma seguir a la siguiente ronda tras el resumen — solo válido en `phase: 'roundEnd'`.
  z.object({ type: z.literal('continue') }),
]);
