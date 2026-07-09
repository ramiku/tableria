import { z } from 'zod';

// Límite defensivo generoso — el tamaño real de la línea de tiempo se comprueba en
// `validateMove` contra `state.timeline.length`. -1 es el valor reservado que usa el timeout del
// servidor para forzar una Paradoja automática (ver `TIMEOUT_POSITION` en logic.ts) — nunca sale
// de un clic real, pero el esquema debe aceptarlo para que `onTurnTimeout` pueda enviarlo.
export const moveSchema = z.object({ position: z.number().int().min(-1).max(60) });
