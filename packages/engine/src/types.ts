import type { z } from 'zod';

/**
 * Único punto de entrada no determinista permitido en `setup`. El resto
 * del motor (`validateMove`/`applyMove`/`checkEnd`) es un reducer puro:
 * nunca debe llamar `Date.now()`, `Math.random()` ni tocar IO. `ctx.now`
 * (en `MoveCtx`) y `ctx.rng` (solo en `SetupCtx`) son las únicas fuentes
 * de no-determinismo, y las inyecta siempre el llamador (el runtime del
 * servidor), nunca el propio juego.
 */
export interface Rng {
  /** Entero en [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** Float en [0, 1). */
  float(): number;
  readonly seed: string;
  readonly calls: number;
}

export interface SetupCtx {
  numPlayers: number;
  rng: Rng;
  options?: Record<string, unknown>;
}

export interface MoveCtx {
  /** Asiento (0-indexado) del jugador que envía el movimiento. */
  seat: number;
  now: Date;
}

export interface PlayerRank {
  seat: number;
  /** 1 = primer puesto. Empates comparten el mismo placement. */
  placement: number;
  result: 'win' | 'lose' | 'draw';
}

export interface GameEndResult {
  ranking: PlayerRank[];
}

export type TimeoutAction<M> = { type: 'forfeit' } | { type: 'move'; move: M };

export interface GameDefinition<S, M> {
  id: string;
  minPlayers: number;
  maxPlayers: number;
  moveSchema: z.ZodType<M>;
  setup(ctx: SetupCtx): S;
  /** Asientos con turno activo ahora mismo. Un array de longitud >1 habilita turnos simultáneos. */
  activePlayers(state: S): number[];
  validateMove(state: S, move: M, ctx: MoveCtx): { ok: true } | { ok: false; code: string };
  /** Reducer puro: sin IO/Date/Math.random. */
  applyMove(state: S, move: M, ctx: MoveCtx): S;
  checkEnd(state: S): GameEndResult | null;
  /** `playerIndex: null` = vista de espectador. */
  playerView(state: S, playerIndex: number | null): unknown;
  onTurnTimeout?(state: S, playerIndex: number): TimeoutAction<M>;
  ui: {
    defaultTurnSeconds?: number;
    supportsRealtime: boolean;
    /** Variantes de reglas que ofrece este juego al crear una mesa (metadatos, no lógica). */
    variants?: { id: string; name: string }[];
  };
}
