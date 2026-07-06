import { z } from 'zod';

// Los límites exactos de `row`/`col` dependen de la orientación y del tamaño de tablero
// (variante elegida al crear la mesa) — se validan en `validateMove` contra `state.rows/cols`,
// no aquí, ya que el schema no conoce la variante en curso.
export const moveSchema = z.object({
  orientation: z.enum(['h', 'v']),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
});
