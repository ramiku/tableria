import type { Db } from '@tableria/db';

/**
 * Único punto de enganche para módulos externos que necesitan reaccionar al
 * cierre de una partida (hoy: el runner de torneos) sin que `match/` tenga que
 * importarlos — evitaría un ciclo (`match/lifecycle.ts` → `tournaments/service.ts`
 * → `match/service.ts` para `startNow` → `match/lifecycle.ts`). Un solo listener
 * basta: no hay más de un consumidor por ahora.
 */
type MatchFinishedListener = (db: Db, matchId: string) => Promise<void>;

let listener: MatchFinishedListener | null = null;

export function onMatchFinished(l: MatchFinishedListener): void {
  listener = l;
}

export async function emitMatchFinished(db: Db, matchId: string): Promise<void> {
  if (!listener) return;
  await listener(db, matchId);
}
