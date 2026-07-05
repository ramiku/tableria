import { describe, expect, it } from 'vitest';
import { updateGlicko, updateGlickoForRanking } from './glicko.js';

describe('updateGlicko', () => {
  it('reproduce el ejemplo de referencia del paper de Glickman', () => {
    // http://www.glicko.net/glicko/glicko2.pdf, sección "Working through the example"
    const player = { rating: 1500, rd: 200, vol: 0.06 };
    const results = [
      { rating: 1400, rd: 30, score: 1 },
      { rating: 1550, rd: 100, score: 0 },
      { rating: 1700, rd: 300, score: 0 },
    ];

    const updated = updateGlicko(player, results);

    expect(updated.rating).toBeCloseTo(1464.06, 1);
    expect(updated.rd).toBeCloseTo(151.52, 1);
    expect(updated.vol).toBeCloseTo(0.05999, 4);
  });

  it('sin resultados en el periodo, solo crece la RD y el rating/vol no cambian', () => {
    const player = { rating: 1600, rd: 80, vol: 0.06 };
    const updated = updateGlicko(player, []);

    expect(updated.rating).toBe(1600);
    expect(updated.vol).toBe(0.06);
    expect(updated.rd).toBeGreaterThan(80);
  });

  it('ganar a un rival más fuerte sube más el rating que ganar a uno más débil', () => {
    const player = { rating: 1500, rd: 100, vol: 0.06 };
    const beatStronger = updateGlicko(player, [{ rating: 1700, rd: 100, score: 1 }]);
    const beatWeaker = updateGlicko(player, [{ rating: 1300, rd: 100, score: 1 }]);

    expect(beatStronger.rating - player.rating).toBeGreaterThan(beatWeaker.rating - player.rating);
  });

  it('perder baja el rating y ganar lo sube frente al mismo rival', () => {
    const player = { rating: 1500, rd: 100, vol: 0.06 };
    const opponent = { rating: 1500, rd: 100 };
    const win = updateGlicko(player, [{ ...opponent, score: 1 }]);
    const loss = updateGlicko(player, [{ ...opponent, score: 0 }]);

    expect(win.rating).toBeGreaterThan(player.rating);
    expect(loss.rating).toBeLessThan(player.rating);
  });
});

describe('updateGlickoForRanking', () => {
  it('con 2 jugadores es equivalente al 1v1 estándar (gana el de menor placement)', () => {
    const a = { id: 'a', placement: 1, rating: { rating: 1500, rd: 200, vol: 0.06 } };
    const b = { id: 'b', placement: 2, rating: { rating: 1500, rd: 200, vol: 0.06 } };

    const updated = updateGlickoForRanking([a, b]);
    const expectedA = updateGlicko(a.rating, [{ rating: b.rating.rating, rd: b.rating.rd, score: 1 }]);
    const expectedB = updateGlicko(b.rating, [{ rating: a.rating.rating, rd: a.rating.rd, score: 0 }]);

    expect(updated.get('a')).toEqual(expectedA);
    expect(updated.get('b')).toEqual(expectedB);
  });

  it('en un empate a 2 jugadores ninguno gana ni pierde rating', () => {
    const a = { id: 'a', placement: 1, rating: { rating: 1500, rd: 200, vol: 0.06 } };
    const b = { id: 'b', placement: 1, rating: { rating: 1500, rd: 200, vol: 0.06 } };

    const updated = updateGlickoForRanking([a, b]);
    expect(updated.get('a')!.rating).toBeCloseTo(1500, 5);
    expect(updated.get('b')!.rating).toBeCloseTo(1500, 5);
  });

  it('con 4 jugadores, el 1º gana rating frente a los 3 restantes y el último lo pierde frente a los 3', () => {
    const base = { rating: 1500, rd: 150, vol: 0.06 };
    const players = [
      { id: 'p1', placement: 1, rating: base },
      { id: 'p2', placement: 2, rating: base },
      { id: 'p3', placement: 3, rating: base },
      { id: 'p4', placement: 4, rating: base },
    ];

    const updated = updateGlickoForRanking(players);

    expect(updated.get('p1')!.rating).toBeGreaterThan(base.rating);
    expect(updated.get('p4')!.rating).toBeLessThan(base.rating);
    // Cuantos más rivales supera, más sube (p1 > p2 > p3 > p4 en rating resultante).
    expect(updated.get('p1')!.rating).toBeGreaterThan(updated.get('p2')!.rating);
    expect(updated.get('p2')!.rating).toBeGreaterThan(updated.get('p3')!.rating);
    expect(updated.get('p3')!.rating).toBeGreaterThan(updated.get('p4')!.rating);
  });
});
