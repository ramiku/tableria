import { describe, expect, it } from 'vitest';
import { assignBracket, nextPowerOfTwo, placementForEliminationRound, seedOrder, totalRoundsForSize } from './bracket.js';

describe('nextPowerOfTwo', () => {
  it('devuelve la potencia de 2 más próxima por arriba', () => {
    expect(nextPowerOfTwo(1)).toBe(1);
    expect(nextPowerOfTwo(2)).toBe(2);
    expect(nextPowerOfTwo(3)).toBe(4);
    expect(nextPowerOfTwo(4)).toBe(4);
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(8)).toBe(8);
    expect(nextPowerOfTwo(9)).toBe(16);
  });
});

describe('seedOrder', () => {
  it('tamaño 2', () => {
    expect(seedOrder(2)).toEqual([1, 2]);
  });

  it('tamaño 4', () => {
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
  });

  it('tamaño 8 (bracket estándar 1v8, 4v5, 2v7, 3v6)', () => {
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it('tamaño 16 empieza igual que el de 8 con las seeds bajas intercaladas', () => {
    const order = seedOrder(16);
    expect(order).toHaveLength(16);
    expect(new Set(order).size).toBe(16); // cada seed aparece exactamente una vez
    expect(order[0]).toBe(1);
    expect(order[1]).toBe(16); // seed 1 siempre se empareja con la última seed del bracket
  });
});

describe('assignBracket', () => {
  it('sin byes (potencia de 2 exacta): empareja 1v4 y 2v3', () => {
    const bracket = assignBracket(['A', 'B', 'C', 'D']);
    expect(bracket).toEqual(['A', 'D', 'B', 'C']);
  });

  it('con 5 participantes (bracket de 8, 3 byes): los 3 mejores sembrados descansan', () => {
    const bracket = assignBracket(['A', 'B', 'C', 'D', 'E']);
    expect(bracket).toEqual(['A', null, 'D', 'E', 'B', null, 'C', null]);
    // 3 byes en total = tamaño de bracket (8) - nº de participantes (5).
    expect(bracket.filter((p) => p === null)).toHaveLength(3);
    // El mejor sembrado siempre descansa cuando hay byes disponibles.
    expect(bracket[0]).toBe('A');
    expect(bracket[1]).toBeNull();
  });

  it('con 6 participantes (bracket de 8, 2 byes): los 2 mejores sembrados descansan', () => {
    const bracket = assignBracket(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(bracket).toEqual(['A', null, 'D', 'E', 'B', null, 'C', 'F']);
    expect(bracket.filter((p) => p === null)).toHaveLength(2);
  });

  it('con 2 participantes: enfrentamiento directo, sin bye', () => {
    expect(assignBracket(['A', 'B'])).toEqual(['A', 'B']);
  });

  it('con 1 participante: bracket degenerado de un solo bye (nunca ocurre en un torneo real con mínimo 2)', () => {
    expect(assignBracket(['A'])).toEqual(['A']);
  });
});

describe('totalRoundsForSize', () => {
  it('calcula log2 del tamaño del bracket', () => {
    expect(totalRoundsForSize(2)).toBe(1);
    expect(totalRoundsForSize(4)).toBe(2);
    expect(totalRoundsForSize(8)).toBe(3);
    expect(totalRoundsForSize(16)).toBe(4);
  });
});

describe('placementForEliminationRound', () => {
  it('bracket de 4 (2 rondas): ronda 1 → 3º empatado, ronda 2 (final) → 2º', () => {
    expect(placementForEliminationRound(1, 2)).toBe(3);
    expect(placementForEliminationRound(2, 2)).toBe(2);
  });

  it('bracket de 8 (3 rondas): ronda 1 → 5º empatado, semifinal → 3º empatado, final → 2º', () => {
    expect(placementForEliminationRound(1, 3)).toBe(5);
    expect(placementForEliminationRound(2, 3)).toBe(3);
    expect(placementForEliminationRound(3, 3)).toBe(2);
  });
});
