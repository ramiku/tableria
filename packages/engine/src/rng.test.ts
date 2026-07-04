import { describe, expect, it } from 'vitest';
import { createRng, serializeRng } from './rng.js';

describe('createRng', () => {
  it('es determinista: misma seed produce la misma secuencia', () => {
    const a = createRng('abc');
    const b = createRng('abc');
    const seqA = Array.from({ length: 20 }, () => a.int(100));
    const seqB = Array.from({ length: 20 }, () => b.int(100));
    expect(seqA).toEqual(seqB);
  });

  it('semillas distintas divergen', () => {
    const a = createRng('abc');
    const b = createRng('xyz');
    expect(a.float()).not.toBe(b.float());
  });

  it('reanuda exactamente desde `calls` guardado', () => {
    const r1 = createRng('abc');
    for (let i = 0; i < 7; i++) r1.int(100);
    const { seed, calls } = serializeRng(r1);
    expect(calls).toBe(7);

    const r2 = createRng(seed, calls);
    const restOfR1 = Array.from({ length: 10 }, () => r1.int(100));
    const fromR2 = Array.from({ length: 10 }, () => r2.int(100));
    expect(fromR2).toEqual(restOfR1);
  });

  it('float() siempre cae en [0, 1)', () => {
    const rng = createRng('float-range');
    for (let i = 0; i < 1000; i++) {
      const v = rng.float();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it.each([1, 2, 9, 100])('int(%d) siempre cae en [0, %d)', (n) => {
    const rng = createRng(`int-range-${n}`);
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(n);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(n);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('expone seed y calls', () => {
    const rng = createRng('seed-visible');
    expect(rng.seed).toBe('seed-visible');
    expect(rng.calls).toBe(0);
    rng.float();
    expect(rng.calls).toBe(1);
  });
});
