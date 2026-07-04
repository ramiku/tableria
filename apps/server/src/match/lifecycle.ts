import { randomBytes } from 'node:crypto';
import { and, eq, matchMoves, matchPlayers, matches, type Db } from '@tableria/db';
import { createRng, type GameEndResult, type MoveCtx, type PlayerRank } from '@tableria/engine';
import { broadcastEnded, broadcastState, broadcastLobby } from './broadcast.js';
import { getGameDefinition } from './games.js';
import { loadEngineState } from './persistence.js';
import type { MatchRuntime } from './registry.js';
import { armReadyTimer, armTurnTimer, disarmReadyTimer, disarmTurnTimer } from './timers.js';

const READY_CHECK_MS = 20_000;
const UNIQUE_VIOLATION = '23505';

export function scheduleReadyCheck(db: Db, runtime: MatchRuntime): void {
  const endsAt = new Date(Date.now() + READY_CHECK_MS);
  armReadyTimer(runtime, endsAt, () => {
    void startMatch(db, runtime).catch((err: unknown) => {
      console.error('startMatch falló tras el ready-check', err);
    });
  });
  void broadcastLobby(db, runtime);
}

export function cancelReadyCheck(db: Db, runtime: MatchRuntime): void {
  disarmReadyTimer(runtime);
  void broadcastLobby(db, runtime);
}

/** Transición starting → in_game: setup del engine, snapshot inicial, primer turnDeadlineAt. */
export async function startMatch(db: Db, runtime: MatchRuntime): Promise<void> {
  disarmReadyTimer(runtime);
  const def = getGameDefinition(runtime.gameId);
  if (!def) throw new Error(`Definición de juego no encontrada: ${runtime.gameId}`);

  const rows = await db
    .select({ seat: matchPlayers.seat })
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, runtime.matchId))
    .orderBy(matchPlayers.seat);

  const seed = randomBytes(16).toString('hex');
  const rng = createRng(seed);
  const state = def.setup({ numPlayers: rows.length, rng });
  const now = new Date();
  const turnDeadlineAt = new Date(now.getTime() + runtime.turnDurationS * 1000);

  await db
    .update(matches)
    .set({ state: 'in_game', rngSeed: seed, stateSnapshot: state, snapshotSeq: 0, turnDeadlineAt, startedAt: now })
    .where(eq(matches.id, runtime.matchId));

  runtime.engine = { def, state, seq: 0 };
  armTurnTimer(runtime, turnDeadlineAt, () => {
    void handleTurnTimeout(db, runtime).catch((err: unknown) => console.error('handleTurnTimeout falló', err));
  });

  await broadcastState(db, runtime);
}

export type ApplyMoveOutcome =
  | { ok: true; ended: boolean }
  | { ok: false; code: string };

/**
 * Pipeline transaccional de un movimiento. El estado autoritativo vive en
 * Postgres (`matches` + `match_moves`); la caché en memoria (`runtime.engine`)
 * solo se muta DESPUÉS de que el INSERT en `match_moves` confirma éxito, y la
 * constraint `UNIQUE(match_id, seq)` actúa como red de seguridad final ante
 * cualquier reordenación de callbacks entre transacciones concurrentes sobre
 * la misma partida (el `FOR UPDATE` de abajo ya serializa el caso normal).
 */
export async function applyPlayerMove(
  db: Db,
  runtime: MatchRuntime,
  seat: number,
  rawMove: unknown,
): Promise<ApplyMoveOutcome> {
  if (!runtime.engine) {
    const def = getGameDefinition(runtime.gameId);
    if (!def) return { ok: false, code: 'MATCH_NOT_FOUND' };
    const loaded = await loadEngineState(db, def, runtime.matchId);
    if (!loaded) return { ok: false, code: 'MATCH_NOT_IN_GAME' };
    runtime.engine = { def, state: loaded.state, seq: loaded.seq };
  }

  const { def } = runtime.engine;
  const parsed = def.moveSchema.safeParse(rawMove);
  if (!parsed.success) return { ok: false, code: 'INVALID_MOVE' };

  let endResult: GameEndResult | null = null;
  let outcome: ApplyMoveOutcome;

  try {
    outcome = await db.transaction(async (tx) => {
      const [row] = await tx.select().from(matches).where(eq(matches.id, runtime.matchId)).for('update');
      if (!row || row.state !== 'in_game') {
        return { ok: false, code: 'MATCH_NOT_IN_GAME' } as const;
      }

      const ctx: MoveCtx = { seat, now: new Date() };
      const active = def.activePlayers(runtime.engine!.state);
      if (!active.includes(seat)) return { ok: false, code: 'NOT_YOUR_TURN' } as const;

      const validation = def.validateMove(runtime.engine!.state, parsed.data, ctx);
      if (!validation.ok) return { ok: false, code: validation.code } as const;

      const nextState = def.applyMove(runtime.engine!.state, parsed.data, ctx);
      const nextSeq = runtime.engine!.seq + 1;

      await tx.insert(matchMoves).values({ matchId: runtime.matchId, seq: nextSeq, playerSeat: seat, move: parsed.data });

      // Solo mutamos la caché tras confirmar que el movimiento quedó persistido.
      runtime.engine!.state = nextState;
      runtime.engine!.seq = nextSeq;

      endResult = def.checkEnd(nextState);
      const shouldSnapshot = nextSeq % 20 === 0 || endResult !== null;
      const snapshotFields = shouldSnapshot ? { stateSnapshot: nextState, snapshotSeq: nextSeq } : {};

      if (endResult) {
        for (const rank of endResult.ranking) {
          await tx
            .update(matchPlayers)
            .set({ placement: rank.placement })
            .where(and(eq(matchPlayers.matchId, runtime.matchId), eq(matchPlayers.seat, rank.seat)));
        }
        await tx
          .update(matches)
          .set({ state: 'finished', finishedAt: new Date(), turnDeadlineAt: null, ...snapshotFields })
          .where(eq(matches.id, runtime.matchId));
      } else {
        const nextDeadline = new Date(Date.now() + runtime.turnDurationS * 1000);
        await tx
          .update(matches)
          .set({ turnDeadlineAt: nextDeadline, ...snapshotFields })
          .where(eq(matches.id, runtime.matchId));
      }

      return { ok: true, ended: endResult !== null } as const;
    });
  } catch (err) {
    if ((err as { code?: string } | null)?.code === UNIQUE_VIOLATION) {
      return { ok: false, code: 'INVALID_MOVE' };
    }
    throw err;
  }

  if (!outcome.ok) return outcome;

  if (endResult) {
    disarmTurnTimer(runtime);
    broadcastEnded(runtime, 'completed', (endResult as GameEndResult).ranking);
  } else {
    const [row] = await db
      .select({ turnDeadlineAt: matches.turnDeadlineAt })
      .from(matches)
      .where(eq(matches.id, runtime.matchId))
      .limit(1);
    if (row?.turnDeadlineAt) {
      armTurnTimer(runtime, row.turnDeadlineAt, () => {
        void handleTurnTimeout(db, runtime).catch((err: unknown) => console.error('handleTurnTimeout falló', err));
      });
    }
    await broadcastState(db, runtime);
  }

  return outcome;
}

export async function handleTurnTimeout(db: Db, runtime: MatchRuntime): Promise<void> {
  if (!runtime.engine) return;
  const { def, state } = runtime.engine;
  const active = def.activePlayers(state);
  if (active.length === 0) return; // ya ha terminado, nada que forzar

  const seat = active[0]!;
  const action = def.onTurnTimeout ? def.onTurnTimeout(state, seat) : ({ type: 'forfeit' } as const);

  if (action.type === 'forfeit') {
    await forfeitMatch(db, runtime, seat);
  } else {
    await applyPlayerMove(db, runtime, seat, action.move);
  }
}

async function forfeitMatch(db: Db, runtime: MatchRuntime, forfeitingSeat: number): Promise<void> {
  const rows = await db
    .select({ seat: matchPlayers.seat })
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, runtime.matchId))
    .orderBy(matchPlayers.seat);

  const ranking: PlayerRank[] = rows.map((r) => ({
    seat: r.seat,
    placement: r.seat === forfeitingSeat ? rows.length : 1,
    result: r.seat === forfeitingSeat ? 'lose' : 'win',
  }));

  await db.transaction(async (tx) => {
    for (const rank of ranking) {
      await tx
        .update(matchPlayers)
        .set({ placement: rank.placement })
        .where(and(eq(matchPlayers.matchId, runtime.matchId), eq(matchPlayers.seat, rank.seat)));
    }
    await tx
      .update(matches)
      .set({ state: 'finished', finishedAt: new Date(), turnDeadlineAt: null })
      .where(eq(matches.id, runtime.matchId));
  });

  disarmTurnTimer(runtime);
  broadcastEnded(runtime, 'forfeit', ranking);
}
