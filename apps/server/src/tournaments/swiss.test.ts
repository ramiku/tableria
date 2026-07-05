import { describe, expect, it } from 'vitest';
import { pairKey, pairSwissRound, pointsForResult, swissRoundsForSize, type SwissStanding } from './swiss.js';

describe('swissRoundsForSize', () => {
  it('calcula ceil(log2(n)), mínimo 1 ronda', () => {
    expect(swissRoundsForSize(2)).toBe(1);
    expect(swissRoundsForSize(3)).toBe(2);
    expect(swissRoundsForSize(4)).toBe(2);
    expect(swissRoundsForSize(5)).toBe(3);
    expect(swissRoundsForSize(8)).toBe(3);
    expect(swissRoundsForSize(9)).toBe(4);
    expect(swissRoundsForSize(16)).toBe(4);
  });
});

describe('pointsForResult', () => {
  it('victoria=1, empate=0.5, derrota=0', () => {
    expect(pointsForResult('win')).toBe(1);
    expect(pointsForResult('draw')).toBe(0.5);
    expect(pointsForResult('lose')).toBe(0);
  });
});

describe('pairKey', () => {
  it('es simétrica (orden-independiente)', () => {
    expect(pairKey('a', 'b')).toBe(pairKey('b', 'a'));
    expect(pairKey('a', 'b')).not.toBe(pairKey('a', 'c'));
  });
});

describe('pairSwissRound', () => {
  const standing = (id: string, points: number, seed: number): SwissStanding => ({ id, points, seed });

  it('ronda 1 sin historial: empareja de arriba abajo por seed (empate a puntos)', () => {
    const standings = [standing('A', 0, 1), standing('B', 0, 2), standing('C', 0, 3), standing('D', 0, 4)];
    expect(pairSwissRound(standings, new Set(), new Set())).toEqual(['A', 'B', 'C', 'D']);
  });

  it('evita repetir un enfrentamiento ya jugado cuando hay alternativa en el mismo grupo de puntos', () => {
    const standings = [standing('A', 1, 1), standing('B', 1, 2), standing('C', 1, 3), standing('D', 1, 4)];
    const played = new Set([pairKey('A', 'B')]);
    // Sin evitar revancha, el emparejamiento natural top-down sería A-B (adyacentes) — debe saltar a C.
    expect(pairSwissRound(standings, played, new Set())).toEqual(['A', 'C', 'B', 'D']);
  });

  it('permite la revancha como último recurso si ya se jugaron todas las combinaciones posibles', () => {
    const standings = [standing('A', 0, 1), standing('B', 0, 2), standing('C', 0, 3), standing('D', 0, 4)];
    const played = new Set([
      pairKey('A', 'B'),
      pairKey('A', 'C'),
      pairKey('A', 'D'),
      pairKey('B', 'C'),
      pairKey('B', 'D'),
      pairKey('C', 'D'),
    ]);
    const slots = pairSwissRound(standings, played, new Set());
    expect(slots).toHaveLength(4);
    expect(new Set(slots)).toEqual(new Set(['A', 'B', 'C', 'D'])); // no se pierde a nadie, aunque repita
  });

  it('con nº impar, descansa quien peor está clasificada y no ha tenido bye todavía', () => {
    const standings = [standing('A', 2, 1), standing('B', 1, 2), standing('C', 1, 3), standing('D', 0, 4), standing('E', 0, 5)];
    const slots = pairSwissRound(standings, new Set(), new Set());
    expect(slots).toEqual(['A', 'B', 'C', 'D', 'E', null]);
  });

  it('si la peor clasificada ya tuvo bye, pasa a la siguiente peor sin bye previo (la anterior vuelve a la bolsa de emparejamiento)', () => {
    const standings = [standing('A', 2, 1), standing('B', 1, 2), standing('C', 1, 3), standing('D', 0, 4), standing('E', 0, 5)];
    const slots = pairSwissRound(standings, new Set(), new Set(['E']));
    expect(slots).toEqual(['A', 'B', 'C', 'E', 'D', null]);
  });

  it('si todo el mundo ya tuvo bye alguna vez, cae en el peor clasificado de todas formas (no cuelga)', () => {
    const standings = [standing('A', 0, 1), standing('B', 0, 2), standing('C', 0, 3)];
    const slots = pairSwissRound(standings, new Set(), new Set(['A', 'B', 'C']));
    expect(slots).toHaveLength(4); // 1 pareja (2) + 1 bye (id + null)
    expect(slots[slots.length - 1]).toBeNull();
  });

  it('con nº par no hay bye', () => {
    const standings = [standing('A', 0, 1), standing('B', 0, 2)];
    expect(pairSwissRound(standings, new Set(), new Set())).toEqual(['A', 'B']);
  });
});
