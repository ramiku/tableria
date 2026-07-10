import { z } from 'zod';

export const moveSchema = z.discriminatedUnion('type', [
  // Máximo 10 jugadores (asientos 0-9) — ver `impostorDefinition.maxPlayers`.
  z.object({ type: z.literal('vote'), target: z.number().int().min(0).max(9) }),
  // Confirma seguir a la siguiente ronda tras el resumen — solo válido en `phase: 'roundEnd'`.
  z.object({ type: z.literal('continue') }),
]);
