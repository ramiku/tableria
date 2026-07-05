/**
 * Motor puro del bracket de eliminación directa — sin IO, mismo estilo que
 * `ratings/glicko.ts`. Solo geometría del torneo: quién juega contra quién en
 * la ronda 1 (con byes) y qué puesto final corresponde a quien cae en cada ronda.
 */

export function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

export function totalRoundsForSize(bracketSize: number): number {
  return Math.log2(bracketSize);
}

/**
 * Orden de seeding estándar de torneos (1 vs N, 2 vs N-1, ... sin que los mejores
 * sembrados se crucen antes de lo debido): `seedOrder(1)=[1]`; para `size` mayor,
 * intercala el orden de la mitad con su complementario (`size+1-seed`).
 */
export function seedOrder(size: number): number[] {
  if (size === 1) return [1];
  const prev = seedOrder(size / 2);
  const result: number[] = [];
  for (const s of prev) {
    result.push(s);
    result.push(size + 1 - s);
  }
  return result;
}

/**
 * Dados los participantes YA ordenados por rating descendente (índice 0 = mejor
 * sembrado), devuelve el orden de bracket para la ronda 1: cada posición es el
 * participante de esa seed, o `null` si la seed no existe (bye). El tamaño del
 * bracket es la potencia de 2 más próxima por arriba al nº de participantes —
 * por construcción del algoritmo de seeding, los byes recaen siempre en los
 * mejores sembrados (seeds 1, 2, ... son las primeras en emparejarse con seeds
 * que no existen cuando el nº de participantes no es potencia de 2).
 */
export function assignBracket<T>(participantsByRatingDesc: T[]): (T | null)[] {
  const n = participantsByRatingDesc.length;
  const size = nextPowerOfTwo(n);
  const order = seedOrder(size);
  return order.map((seed) => (seed <= n ? participantsByRatingDesc[seed - 1]! : null));
}

/**
 * Puesto final de quien queda eliminado en `round` (1-indexado) de un bracket
 * con `totalRounds` rondas en total. La ronda final da el 2º puesto; la
 * semifinal dos 3º puestos empatados; etc. — mismo convenio de "empates
 * comparten placement" que usa `PlayerRank` del motor de juego.
 */
export function placementForEliminationRound(round: number, totalRounds: number): number {
  return 2 ** (totalRounds - round) + 1;
}
