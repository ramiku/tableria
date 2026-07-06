import { and, eq, gt, lt, reputationEvents, userReports, users, type Db, type Tx } from '@tableria/db';
import { clampReputation, escalatedAbandonDelta, MAX_REPUTATION, profanityDelta } from './rules.js';

const ESCALATION_WINDOW_DAYS = 30;
const PROFANITY_WINDOW_HOURS = 24;
const REPORT_PENALTY = -5;
const PASSIVE_RECOVERY_WINDOW_DAYS = 3;
const PASSIVE_RECOVERY_DELTA = 1;

export type ReputationReason =
  | 'match_abandoned'
  | 'match_forfeit_timeout'
  | 'match_completed_clean'
  | 'chat_blocked_profanity'
  | 'user_report'
  | 'passive_recovery';

export type UserReportReason = 'abusive_language' | 'unsportsmanlike' | 'cheating' | 'other';

/**
 * Punto único de escritura de reputación: lee el valor actual, clampa el
 * resultado y deja constancia en `reputationEvents` con el before/after real
 * (no el delta "pedido" — si ya estaba al tope/suelo, el delta aplicado es 0
 * pero igualmente se registra, porque ese registro es lo que cuentan las
 * ventanas rodantes de más abajo, p.ej. el primer aviso de insulto).
 */
async function applyReputationEvent(
  db: Db | Tx,
  userId: string,
  reason: ReputationReason,
  requestedDelta: number,
  matchId?: string,
): Promise<void> {
  const [row] = await db.select({ reputation: users.reputation }).from(users).where(eq(users.id, userId)).limit(1);
  if (!row) return;

  const before = row.reputation;
  const after = clampReputation(before + requestedDelta);

  if (after !== before) {
    await db.update(users).set({ reputation: after }).where(eq(users.id, userId));
  }
  await db.insert(reputationEvents).values({
    userId,
    reason,
    delta: after - before,
    reputationBefore: before,
    reputationAfter: after,
    matchId: matchId ?? null,
  });
}

async function countRecentEvents(db: Db | Tx, userId: string, reasons: ReputationReason[], since: Date): Promise<number> {
  const rows = await db
    .select({ reason: reputationEvents.reason })
    .from(reputationEvents)
    .where(and(eq(reputationEvents.userId, userId), gt(reputationEvents.createdAt, since)));
  // El filtro por `reason` se hace en JS: son pocas filas por usuario, no merece la pena
  // depender de `inArray` con el tipo enum estricto solo para esta comprobación puntual.
  const reasonSet = new Set(reasons);
  return rows.filter((r) => reasonSet.has(r.reason as ReputationReason)).length;
}

/**
 * Se llama dentro de la MISMA transacción que cierra una partida (natural, forfeit
 * por timeout o abandono voluntario) — un asiento por llamada.
 * - 'clean': terminó con normalidad → +1 (tope 100), el incentivo de jugar limpio.
 * - 'abandoned' / 'timeout': abandono real → penalización que escala con la
 *   reincidencia de los últimos 30 días (un desliz puntual pesa poco; ser habitual, mucho).
 */
export async function recordMatchEnd(
  tx: Tx,
  userId: string,
  matchId: string,
  kind: 'clean' | 'abandoned' | 'timeout',
): Promise<void> {
  if (kind === 'clean') {
    await applyReputationEvent(tx, userId, 'match_completed_clean', 1, matchId);
    return;
  }

  const reason: ReputationReason = kind === 'abandoned' ? 'match_abandoned' : 'match_forfeit_timeout';
  const since = new Date(Date.now() - ESCALATION_WINDOW_DAYS * 86_400_000);
  const priorCount = await countRecentEvents(tx, userId, ['match_abandoned', 'match_forfeit_timeout'], since);
  await applyReputationEvent(tx, userId, reason, escalatedAbandonDelta(kind, priorCount), matchId);
}

/**
 * Chat de mesa o DM con lenguaje detectado — el mensaje ya se bloqueó antes de llegar
 * aquí (ver `moderation/profanity.ts`). La primera vez en 24h es solo un aviso (delta 0,
 * pero queda registrado); a partir de la segunda, resta.
 */
export async function recordProfanityBlock(db: Db, userId: string): Promise<void> {
  const since = new Date(Date.now() - PROFANITY_WINDOW_HOURS * 3_600_000);
  const priorCount = await countRecentEvents(db, userId, ['chat_blocked_profanity'], since);
  await applyReputationEvent(db, userId, 'chat_blocked_profanity', profanityDelta(priorCount));
}

/**
 * Reporte de otro jugador tras una partida compartida. El `unique` de `userReports`
 * (reporterId, reportedUserId, matchId) es la guarda antiabuso: no se puede reportar
 * dos veces a la misma persona por la misma mesa.
 */
export async function recordReport(
  db: Db,
  params: { reporterId: string; reportedUserId: string; matchId: string; reason: UserReportReason; comment?: string },
): Promise<{ ok: true } | { ok: false; code: 'ALREADY_REPORTED' }> {
  try {
    await db.insert(userReports).values({
      reporterId: params.reporterId,
      reportedUserId: params.reportedUserId,
      matchId: params.matchId,
      reason: params.reason,
      comment: params.comment ?? null,
    });
  } catch (err) {
    if ((err as { code?: string } | null)?.code === '23505') return { ok: false, code: 'ALREADY_REPORTED' };
    throw err;
  }
  await applyReputationEvent(db, params.reportedUserId, 'user_report', REPORT_PENALTY, params.matchId);
  return { ok: true };
}

/**
 * Job periódico (ver `index.ts`, mismo patrón que `ws/heartbeat.ts`): a quien tenga
 * reputación por debajo del tope y ningún evento negativo en los últimos 3 días le
 * concede +1 — así también se recupera quien deja de jugar tras un tropiezo, no solo
 * quien encadena partidas limpias.
 */
const PASSIVE_RECOVERY_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Arranca el job de recuperación pasiva — mismo patrón que `ws/heartbeat.ts::startHeartbeat`. */
export function startPassiveRecoveryJob(db: Db): void {
  setInterval(() => {
    void runPassiveRecovery(db).catch((err: unknown) => console.error('runPassiveRecovery falló', err));
  }, PASSIVE_RECOVERY_INTERVAL_MS);
}

export async function runPassiveRecovery(db: Db): Promise<void> {
  const since = new Date(Date.now() - PASSIVE_RECOVERY_WINDOW_DAYS * 86_400_000);
  const candidates = await db.select({ id: users.id }).from(users).where(lt(users.reputation, MAX_REPUTATION));

  for (const candidate of candidates) {
    const rows = await db
      .select({ delta: reputationEvents.delta })
      .from(reputationEvents)
      .where(and(eq(reputationEvents.userId, candidate.id), gt(reputationEvents.createdAt, since)));
    const hasRecentNegative = rows.some((r) => r.delta < 0);
    if (hasRecentNegative) continue;
    await applyReputationEvent(db, candidate.id, 'passive_recovery', PASSIVE_RECOVERY_DELTA);
  }
}
