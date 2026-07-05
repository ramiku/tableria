import { z } from 'zod';

/**
 * El límite superior real de columna depende del tamaño de tablero de esta partida en
 * concreto (variante elegida al crear la mesa, ver `BOARD_PRESETS`), así que aquí solo se
 * acota un máximo defensivo — el rango real se comprueba en `validateMove` contra `state.cols`.
 */
export const moveSchema = z.object({ column: z.number().int().min(0).max(20) });
