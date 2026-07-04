import { and, asc, eq, gt, matchMoves, matches, type Db } from '@tableria/db';
import type { GameDefinition } from '@tableria/engine';

export interface LoadedEngineState {
  state: unknown;
  seq: number;
}

/**
 * Reconstruye el estado autoritativo de una partida: snapshot persistido
 * + replay de los movimientos posteriores. Solo tiene sentido para
 * partidas que ya han pasado por `startMatch` (state snapshot no nulo).
 */
export async function loadEngineState(
  db: Db,
  def: GameDefinition<unknown, unknown>,
  matchId: string,
): Promise<LoadedEngineState | null> {
  const [row] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!row || row.stateSnapshot == null) return null;

  let state: unknown = row.stateSnapshot;
  let seq = row.snapshotSeq;

  const pending = await db
    .select()
    .from(matchMoves)
    .where(and(eq(matchMoves.matchId, matchId), gt(matchMoves.seq, seq)))
    .orderBy(asc(matchMoves.seq));

  const now = new Date();
  for (const move of pending) {
    state = def.applyMove(state, move.move, { seat: move.playerSeat, now });
    seq = move.seq;
  }

  return { state, seq };
}
