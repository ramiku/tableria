import type { Rng } from './types.js';

/** xmur3: hash de una seed string a un entero de 32 bits, usado para sembrar mulberry32. */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** mulberry32: PRNG determinista de 32 bits, rápido y suficientemente uniforme para juegos de mesa. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Crea un Rng determinista a partir de una seed string. `calls` permite
 * reanudar exactamente donde se quedó una partida persistida: se avanza
 * el generador ese número de pasos antes de servir el primer valor real.
 */
export function createRng(seed: string, calls = 0): Rng {
  const next = mulberry32(xmur3(seed)());
  let callCount = 0;
  for (let i = 0; i < calls; i++) next();
  callCount = calls;

  const float = (): number => {
    callCount++;
    return next();
  };

  return {
    seed,
    get calls() {
      return callCount;
    },
    float,
    int(maxExclusive: number): number {
      return Math.floor(float() * maxExclusive);
    },
  };
}

export function serializeRng(rng: Rng): { seed: string; calls: number } {
  return { seed: rng.seed, calls: rng.calls };
}
