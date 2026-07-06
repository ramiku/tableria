/**
 * Reglas puras de puntuación de reputación — sin IO, para poder testearlas sin BD.
 * `service.ts` es la capa que las conecta con Postgres (mismo reparto que
 * `ratings/glicko.ts` puro + `ratings/service.ts` con el IO).
 */

export const MIN_REPUTATION = 1;
export const MAX_REPUTATION = 100;

const ABANDON_BASE_DELTA = -8;
const TIMEOUT_BASE_DELTA = -5;
const ESCALATION_STEP = -2;
const ESCALATION_FLOOR = -20;

const PROFANITY_PENALTY = -3;

/** 1-100 siempre — nunca sube del tope ni baja del suelo. */
export function clampReputation(value: number): number {
  return Math.min(MAX_REPUTATION, Math.max(MIN_REPUTATION, value));
}

/**
 * Delta por abandonar una partida sin terminarla. `priorCount` es cuántos
 * abandonos/timeouts tiene el usuario en la ventana rodante de 30 días —
 * la penalización escala con la reincidencia (un desliz puntual pesa poco;
 * ser habitual, mucho), con un suelo para que no se dispare sin límite.
 */
export function escalatedAbandonDelta(kind: 'abandoned' | 'timeout', priorCount: number): number {
  const base = kind === 'abandoned' ? ABANDON_BASE_DELTA : TIMEOUT_BASE_DELTA;
  return Math.max(ESCALATION_FLOOR, base + priorCount * ESCALATION_STEP);
}

/**
 * Delta por un mensaje bloqueado por lenguaje ofensivo. `priorCount` es cuántos
 * bloqueos tiene el usuario en las últimas 24h — el primero es solo un aviso
 * (no resta), a partir del segundo sí.
 */
export function profanityDelta(priorCountInWindow: number): number {
  return priorCountInWindow === 0 ? 0 : PROFANITY_PENALTY;
}
