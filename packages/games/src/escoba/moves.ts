import { z } from 'zod';

// La mano nunca supera 3 cartas; la mesa puede crecer bastante si se encadenan jugadas sin
// captura, pero un límite defensivo generoso evita aceptar payloads absurdos.
export const moveSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('play'),
    cardIndex: z.number().int().min(0).max(2),
    captureIndices: z.array(z.number().int().min(0)).max(40),
  }),
  // Confirma seguir a la siguiente mano tras el resumen — solo válido en `phase: 'roundEnd'`.
  z.object({ type: z.literal('continue') }),
]);
