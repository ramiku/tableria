import { z } from 'zod';

const suitSchema = z.enum(['oros', 'copas', 'espadas', 'bastos']);

// La mano más larga posible es 16 cartas (Tute Cabrón, 3 jugadores reparten la baraja de 48 a
// partes iguales); Tute con 4 se queda en 12. El límite real de cada partida se comprueba en
// `validateMove` contra el tamaño real de la mano de ese asiento.
export const moveSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('play'),
    cardIndex: z.number().int().min(0).max(15),
    cante: suitSchema.optional(),
  }),
  // Confirma seguir a la siguiente ronda tras el resumen — solo válido en `phase: 'roundEnd'`.
  z.object({ type: z.literal('continue') }),
]);
