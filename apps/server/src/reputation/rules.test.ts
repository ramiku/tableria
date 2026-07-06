import { describe, expect, it } from 'vitest';
import { clampReputation, escalatedAbandonDelta, profanityDelta } from './rules.js';

describe('clampReputation', () => {
  it('nunca baja de 1', () => {
    expect(clampReputation(-30)).toBe(1);
  });

  it('nunca sube de 100', () => {
    expect(clampReputation(140)).toBe(100);
  });

  it('deja pasar valores dentro del rango', () => {
    expect(clampReputation(57)).toBe(57);
  });
});

describe('escalatedAbandonDelta', () => {
  it('un abandono voluntario sin antecedentes resta 8', () => {
    expect(escalatedAbandonDelta('abandoned', 0)).toBe(-8);
  });

  it('un timeout sin antecedentes resta menos que un abandono voluntario', () => {
    expect(escalatedAbandonDelta('timeout', 0)).toBe(-5);
  });

  it('escala con la reincidencia de los últimos 30 días', () => {
    expect(escalatedAbandonDelta('abandoned', 1)).toBe(-10);
    expect(escalatedAbandonDelta('abandoned', 2)).toBe(-12);
  });

  it('la escalada tiene un suelo: no se dispara sin límite', () => {
    expect(escalatedAbandonDelta('abandoned', 50)).toBe(-20);
  });
});

describe('profanityDelta', () => {
  it('la primera vez en la ventana es solo un aviso, no resta', () => {
    expect(profanityDelta(0)).toBe(0);
  });

  it('a partir de la segunda vez en la ventana, resta', () => {
    expect(profanityDelta(1)).toBe(-3);
    expect(profanityDelta(5)).toBe(-3);
  });
});
