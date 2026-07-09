import { randomBytes } from 'node:crypto';
import { and, eq, inArray, matchMoves, matchPlayers, matches, type Db, type Tx } from '@tableria/db';
import { createRng, type GameEndResult, type MoveCtx, type PlayerRank } from '@tableria/engine';
import { applyMatchResult, type RatingDeltas } from '../ratings/service.js';
import * as reputation from '../reputation/service.js';
import * as notifications from '../social/notifications.js';
import { setInGame, socketsFor } from '../social/presence.js';
import { sendToSocket } from '../ws/send.js';
import { broadcastAbandonStatus, broadcastEnded, broadcastState } from './broadcast.js';
import { emitMatchFinished } from './events.js';
import { getGameDefinition } from './games.js';
import { loadEngineState } from './persistence.js';
import type { MatchRuntime } from './registry.js';
import { armTurnTimer, disarmTurnTimer } from './timers.js';

const UNIQUE_VIOLATION = '23505';

/**
 * Cierre compartido de partida: marca `placement` de cada asiento y delega en
 * `ratings.applyMatchResult` la escritura de `userGameStats` (siempre) y, si la
 * partida es `rated`, del rating Glicko-2 + historial. Usado por los dos
 * caminos de fin de partida (natural vía `checkEnd()` y forfeit por timeout)
 * para que ambos escriban rating/stats exactamente igual.
 */
async function finishMatchTx(
  tx: Tx,
  runtime: MatchRuntime,
  ranking: PlayerRank[],
  rated: boolean,
  seatToUserId: Map<number, string>,
): Promise<RatingDeltas> {
  for (const rank of ranking) {
    await tx
      .update(matchPlayers)
      .set({ placement: rank.placement })
      .where(and(eq(matchPlayers.matchId, runtime.matchId), eq(matchPlayers.seat, rank.seat)));
  }
  return applyMatchResult(tx, { matchId: runtime.matchId, gameId: runtime.gameId, rated, ranking, seatToUserId });
}

/**
 * Secuencia común tras confirmar el fin de una partida (ambos caminos: natural
 * y forfeit): parar el timer, difundir el resultado, liberar la presencia
 * "en partida" y avisar a quien esté escuchando cierres de partida (hoy: el
 * runner de torneos, vía `match/events.ts`, para avanzar el bracket si procede).
 */
async function finishRuntimeAndNotify(
  db: Db,
  runtime: MatchRuntime,
  reason: 'completed' | 'forfeit',
  ranking: PlayerRank[],
  ratingDeltas: RatingDeltas,
): Promise<void> {
  disarmTurnTimer(runtime);
  runtime.timeoutPending = null;
  broadcastEnded(runtime, reason, ranking, ratingDeltas);
  await setInGameForMatch(db, runtime.matchId, false);
  await emitMatchFinished(db, runtime.matchId).catch((err: unknown) => console.error('emitMatchFinished falló', err));
}

/** Transición starting → in_game: setup del engine, snapshot inicial, primer turnDeadlineAt. */
export async function startMatch(db: Db, runtime: MatchRuntime): Promise<void> {
  const def = getGameDefinition(runtime.gameId);
  if (!def) throw new Error(`Definición de juego no encontrada: ${runtime.gameId}`);

  const rows = await db
    .select({ seat: matchPlayers.seat, userId: matchPlayers.userId })
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, runtime.matchId))
    .orderBy(matchPlayers.seat);

  const seed = randomBytes(16).toString('hex');
  const rng = createRng(seed);
  const state = def.setup({ numPlayers: rows.length, rng, options: runtime.options ?? undefined });
  const now = new Date();
  // null = partida "sin tiempo": no se arma temporizador, nunca hay forfeit por reloj.
  const turnDeadlineAt = runtime.turnDurationS != null ? new Date(now.getTime() + runtime.turnDurationS * 1000) : null;

  await db
    .update(matches)
    .set({ state: 'in_game', rngSeed: seed, stateSnapshot: state, snapshotSeq: 0, turnDeadlineAt, startedAt: now })
    .where(eq(matches.id, runtime.matchId));

  runtime.engine = { def, state, seq: 0 };
  if (turnDeadlineAt) {
    armTurnTimer(runtime, turnDeadlineAt, () => {
      void handleTurnTimeout(db, runtime).catch((err: unknown) => console.error('handleTurnTimeout falló', err));
    });
  }

  await broadcastState(db, runtime);
  void setInGame(db, rows.map((r) => r.userId), true).catch((err: unknown) => console.error('setInGame falló', err));
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
  let ratingDeltas: RatingDeltas = new Map();
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
        const playerRows = await tx
          .select({ seat: matchPlayers.seat, userId: matchPlayers.userId })
          .from(matchPlayers)
          .where(eq(matchPlayers.matchId, runtime.matchId));
        const seatToUserId = new Map(playerRows.map((r) => [r.seat, r.userId]));
        ratingDeltas = await finishMatchTx(tx, runtime, endResult.ranking, row.rated, seatToUserId);

        // Terminó con normalidad (nadie abandonó) — el incentivo de "buen juego": +1 de
        // reputación para todos los que la jugaron hasta el final, tope 100.
        for (const userId of seatToUserId.values()) {
          await reputation.recordMatchEnd(tx, userId, runtime.matchId, 'clean');
        }

        await tx
          .update(matches)
          .set({ state: 'finished', endReason: 'completed', finishedAt: new Date(), turnDeadlineAt: null, ...snapshotFields })
          .where(eq(matches.id, runtime.matchId));
      } else {
        // En juegos con turnos simultáneos (varios asientos activos a la vez, p.ej. todos
        // dando pista salvo el adivinador) cada jugador manda su movimiento por separado,
        // pero siguen siendo parte de la MISMA ronda mientras el conjunto de activos tras
        // el movimiento sea subconjunto del de antes (solo se ha ido vaciando). Recién ahí
        // se conserva el `turnDeadlineAt` ya armado; si aparece algún asiento nuevo (p.ej.
        // pasa a ser el turno del adivinador) es una ronda/fase distinta y toca reiniciar el reloj.
        const activeAfter = def.activePlayers(nextState);
        const sameRound = activeAfter.length > 0 && activeAfter.every((s) => active.includes(s));

        if (sameRound) {
          if (Object.keys(snapshotFields).length > 0) {
            await tx.update(matches).set(snapshotFields).where(eq(matches.id, runtime.matchId));
          }
        } else if (runtime.turnDurationS != null) {
          const nextDeadline = new Date(Date.now() + runtime.turnDurationS * 1000);
          await tx
            .update(matches)
            .set({ turnDeadlineAt: nextDeadline, ...snapshotFields })
            .where(eq(matches.id, runtime.matchId));
        } else if (Object.keys(snapshotFields).length > 0) {
          // Partida "sin tiempo": no hay deadline que reiniciar, solo persistir el snapshot si toca.
          await tx.update(matches).set(snapshotFields).where(eq(matches.id, runtime.matchId));
        }
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

  // Un movimiento real cancela cualquier petición de abandono mutuo pendiente — seguir
  // jugando es la señal más clara de que ya no se quiere cortar la partida.
  if (runtime.abandonRequests.size > 0) {
    runtime.abandonRequests.clear();
    broadcastAbandonStatus(runtime);
  }

  // El asiento que había agotado su turno por fin movió — se resuelve solo, sin que nadie
  // tuviera que reclamar la victoria.
  if (runtime.timeoutPending?.seat === seat) {
    runtime.timeoutPending = null;
  }

  if (endResult) {
    await finishRuntimeAndNotify(db, runtime, 'completed', (endResult as GameEndResult).ranking, ratingDeltas);
  } else {
    const [row] = await db
      .select({ turnDeadlineAt: matches.turnDeadlineAt })
      .from(matches)
      .where(eq(matches.id, runtime.matchId))
      .limit(1);
    // Si el deadline ya venció (movimiento aplicado dentro del propio bucle de `handleTurnTimeout`
    // al forzar a varios asientos de una ronda simultánea — ver `sameRound` más arriba), no se arma
    // nada: rearmar con un plazo ya pasado dispara casi al instante y duplicaría el forzado de los
    // asientos restantes, que el bucle en curso ya se encarga de resolver. Mismo criterio que usa
    // `recoverOnBoot` al arrancar con partidas cuyo turno venció mientras el proceso estaba caído.
    if (row?.turnDeadlineAt && row.turnDeadlineAt > new Date()) {
      armTurnTimer(runtime, row.turnDeadlineAt, () => {
        void handleTurnTimeout(db, runtime).catch((err: unknown) => console.error('handleTurnTimeout falló', err));
      });
    }
    await broadcastState(db, runtime);
    await notifyTurnIfAsync(db, runtime);
  }

  return outcome;
}

/**
 * En partidas async no hay nadie mirando el tablero en directo entre turno y turno,
 * así que se avisa por notificación in-app a quien pase a estar activo. En tiempo real
 * no hace falta: ambos jugadores ya están delante de la mesa.
 */
async function notifyTurnIfAsync(db: Db, runtime: MatchRuntime): Promise<void> {
  if (runtime.mode !== 'async' || !runtime.engine) return;
  const activeSeats = runtime.engine.def.activePlayers(runtime.engine.state);
  if (activeSeats.length === 0) return;

  const rows = await db
    .select({ seat: matchPlayers.seat, userId: matchPlayers.userId })
    .from(matchPlayers)
    .where(and(eq(matchPlayers.matchId, runtime.matchId), inArray(matchPlayers.seat, activeSeats)));

  for (const row of rows) {
    const payload = { matchId: runtime.matchId, code: runtime.code };
    const notification = await notifications.create(db, row.userId, 'your_turn', payload);
    for (const socket of socketsFor(row.userId)) {
      sendToSocket(socket, {
        type: 'notification.new',
        payload: {
          id: notification.id,
          type: notification.type,
          payload: notification.payload,
          createdAt: notification.createdAt.toISOString(),
        },
      });
    }
  }
}

/**
 * En juegos por turnos (activePlayers = 1 asiento) esto resuelve el único rezagado, igual que
 * siempre. En juegos con turnos simultáneos (varios asientos activos a la vez, p.ej. todos dando
 * pista salvo el adivinador) TODOS los que no movieron a tiempo deben resolverse, no solo el
 * primero — de lo contrario el resto se queda esperando un movimiento que nunca llega. Se
 * recalculan los activos en cada iteración por si aplicar la acción de uno ya hizo avanzar la
 * ronda (p.ej. era el último que faltaba) y deja de tener sentido tocar a los demás.
 */
export async function handleTurnTimeout(db: Db, runtime: MatchRuntime): Promise<void> {
  if (!runtime.engine) return;

  for (const seat of runtime.engine.def.activePlayers(runtime.engine.state)) {
    if (!runtime.engine) return; // la partida terminó a mitad del bucle (p.ej. un forfeit previo)
    const { def, state } = runtime.engine;
    const stillActive = def.activePlayers(state);
    if (!stillActive.includes(seat)) continue; // esta ronda ya se resolvió sin necesitar a este asiento

    const action = def.onTurnTimeout ? def.onTurnTimeout(state, seat) : ({ type: 'forfeit' } as const);

    if (action.type === 'forfeit') {
      // Ya no se hace forfeit automático: se ofrece la decisión al resto de asientos, que pueden
      // reclamar la victoria ya mismo (`claimTimeoutVictory`) o esperar a que este asiento mueva —
      // un movimiento real de este mismo asiento limpia `timeoutPending` solo (ver `applyPlayerMove`).
      runtime.timeoutPending = { seat };
      await broadcastState(db, runtime);
      return;
    } else {
      await applyPlayerMove(db, runtime, seat, action.move);
    }
  }
}

/**
 * Resuelve un aviso de tiempo agotado pendiente: un asiento distinto del rezagado decide
 * cortar la partida ya mismo y reclamar la victoria, en vez de seguir esperando su turno.
 * Reutiliza `forfeitMatch` con `reason:'timeout'` — mismo cierre que el forfeit automático de antes.
 */
export async function claimTimeoutVictory(db: Db, runtime: MatchRuntime, claimingSeat: number): Promise<void> {
  if (!runtime.timeoutPending || runtime.timeoutPending.seat === claimingSeat) return;
  const { seat } = runtime.timeoutPending;
  runtime.timeoutPending = null;
  await forfeitMatch(db, runtime, seat, 'timeout');
}

/**
 * Cierra la partida por abandono de un solo asiento — derrota real para quien
 * abandona, victoria para el resto. `reason` distingue el motivo a efectos de
 * reputación: `'quit'` (abandono voluntario, `match.forfeit`) penaliza más que
 * `'timeout'` (no mover a tiempo, puede ser un corte de conexión).
 */
export async function forfeitMatch(
  db: Db,
  runtime: MatchRuntime,
  forfeitingSeat: number,
  reason: 'timeout' | 'quit',
): Promise<void> {
  const rows = await db
    .select({ seat: matchPlayers.seat, userId: matchPlayers.userId })
    .from(matchPlayers)
    .where(eq(matchPlayers.matchId, runtime.matchId))
    .orderBy(matchPlayers.seat);

  const ranking: PlayerRank[] = rows.map((r) => ({
    seat: r.seat,
    placement: r.seat === forfeitingSeat ? rows.length : 1,
    result: r.seat === forfeitingSeat ? 'lose' : 'win',
  }));
  const seatToUserId = new Map(rows.map((r) => [r.seat, r.userId]));

  const [matchRow] = await db.select({ rated: matches.rated }).from(matches).where(eq(matches.id, runtime.matchId)).limit(1);
  const rated = matchRow?.rated ?? false;

  const ratingDeltas = await db.transaction(async (tx) => {
    const deltas = await finishMatchTx(tx, runtime, ranking, rated, seatToUserId);
    await tx
      .update(matches)
      .set({ state: 'finished', endReason: 'forfeit', finishedAt: new Date(), turnDeadlineAt: null })
      .where(eq(matches.id, runtime.matchId));

    for (const [seat, userId] of seatToUserId) {
      const kind = seat === forfeitingSeat ? (reason === 'quit' ? 'abandoned' : 'timeout') : 'clean';
      await reputation.recordMatchEnd(tx, userId, runtime.matchId, kind);
    }
    return deltas;
  });

  runtime.abandonRequests.clear();
  await finishRuntimeAndNotify(db, runtime, 'forfeit', ranking, ratingDeltas);
}

/**
 * Abandono mutuo: se propone con `match.abandonRequest` y solo se efectúa cuando
 * todos los asientos sentados lo han pedido. Neutral por diseño — a diferencia de
 * `forfeitMatch`, no toca rating ni estadísticas ni reputación de nadie, porque no
 * hay ganador ni perdedor real, solo un cierre consensuado.
 */
export async function requestMutualAbandon(db: Db, runtime: MatchRuntime, seat: number): Promise<void> {
  if (!runtime.engine) return;
  runtime.abandonRequests.add(seat);

  if (runtime.abandonRequests.size < runtime.maxPlayers) {
    broadcastAbandonStatus(runtime);
    return;
  }

  disarmTurnTimer(runtime);
  runtime.timeoutPending = null;
  await db
    .update(matches)
    .set({ state: 'abandoned', endReason: 'abandoned', finishedAt: new Date(), turnDeadlineAt: null })
    .where(eq(matches.id, runtime.matchId));
  await db.update(matchPlayers).set({ leftAt: new Date() }).where(eq(matchPlayers.matchId, runtime.matchId));

  // Se conserva `runtime.engine` (a diferencia de antes, que lo ponía a null): con `state` ya en
  // 'abandoned' en BD, `applyPlayerMove` rechaza cualquier movimiento posterior igual que en un
  // cierre normal — y mantenerlo poblado es lo que permite que quien reconecte en el mismo
  // proceso (sin reinicio del server) siga viendo el tablero final y el resultado, igual que ya
  // pasa en `finishRuntimeAndNotify`.
  runtime.abandonRequests.clear();

  broadcastEnded(runtime, 'abandoned', [], new Map());
  await setInGameForMatch(db, runtime.matchId, false);
  // A diferencia de `finishRuntimeAndNotify`, no se llama a `emitMatchFinished`: un abandono
  // mutuo no tiene ranking ni ganador, así que el runner de torneos (único listener hoy) no
  // tendría con qué avanzar el bracket — las mesas de torneo quedan fuera de alcance por ahora.
}

export function cancelMutualAbandon(runtime: MatchRuntime, seat: number): void {
  if (!runtime.abandonRequests.delete(seat)) return;
  broadcastAbandonStatus(runtime);
}

async function setInGameForMatch(db: Db, matchId: string, inGame: boolean): Promise<void> {
  const rows = await db.select({ userId: matchPlayers.userId }).from(matchPlayers).where(eq(matchPlayers.matchId, matchId));
  await setInGame(
    db,
    rows.map((r) => r.userId),
    inGame,
  );
}
