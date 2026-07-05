/**
 * Motor puro de emparejamiento suizo — sin IO, mismo estilo que `bracket.ts`.
 * A diferencia de la eliminación directa (geometría de árbol fija desde la
 * ronda 1), el suizo empareja cada ronda según la puntuación acumulada hasta
 * ese momento, evitando repetir enfrentamientos ya jugados cuando es posible.
 */

export interface SwissStanding {
  id: string;
  points: number;
  /** Seed inicial (por rating) — solo se usa como desempate estable cuando dos jugadores empatan a puntos. */
  seed: number;
}

/** Nº de rondas estándar para separar a `n` jugadores con puntuación binaria (log2, redondeado por arriba). */
export function swissRoundsForSize(n: number): number {
  return Math.max(1, Math.ceil(Math.log2(Math.max(n, 2))));
}

/** Puntos que suma un resultado (1 victoria, 0.5 empate, 0 derrota) — igual que en ajedrez/torneos suizos clásicos. */
export function pointsForResult(result: 'win' | 'lose' | 'draw'): number {
  return result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
}

/** Clave canónica (orden-independiente) para identificar una pareja ya jugada. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Empareja una ronda: ordena por puntos desc (desempate por seed asc), separa
 * al jugador que descansa si el nº de jugadores es impar (el de peor
 * clasificación que todavía no haya descansado esta edición), y empareja al
 * resto de arriba abajo evitando repetir una pareja ya jugada — si no queda
 * ningún rival sin repetir para alguien, se acepta la revancha como último
 * recurso antes que dejar a alguien sin partida.
 *
 * Devuelve los ids en el mismo formato que `assignBracket`: posiciones
 * `[2k, 2k+1]` son una pareja; `null` marca el hueco vacío de un bye.
 */
export function pairSwissRound(
  standings: SwissStanding[],
  playedPairs: ReadonlySet<string>,
  alreadyHadBye: ReadonlySet<string>,
): (string | null)[] {
  const sorted = [...standings].sort((a, b) => b.points - a.points || a.seed - b.seed);

  let byeId: string | null = null;
  const pool = [...sorted];
  if (pool.length % 2 === 1) {
    let idx = pool.length - 1;
    while (idx > 0 && alreadyHadBye.has(pool[idx]!.id)) idx--;
    byeId = pool[idx]!.id;
    pool.splice(idx, 1);
  }

  const slots: (string | null)[] = [];
  while (pool.length > 0) {
    const top = pool.shift()!;
    let opponentIdx = pool.findIndex((p) => !playedPairs.has(pairKey(top.id, p.id)));
    if (opponentIdx === -1) opponentIdx = 0; // todos ya jugados contra `top`: revancha como último recurso
    const [opponent] = pool.splice(opponentIdx, 1);
    slots.push(top.id, opponent!.id);
  }

  if (byeId) slots.push(byeId, null);
  return slots;
}
