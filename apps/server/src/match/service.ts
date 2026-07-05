import { and, eq, matchChatMessages, matchPlayers, matchSpectators, matches, type Db } from '@tableria/db';
import { broadcastChat, broadcastLobby, broadcastState, sendChatHistory, sendError } from './broadcast.js';
import { getGameDefinition } from './games.js';
import { applyPlayerMove, handleTurnTimeout, startMatch } from './lifecycle.js';
import { loadEngineState } from './persistence.js';
import {
  addPlayerSocket,
  createEmptyRuntime,
  removeSocketEverywhere,
  type AuthedSocket,
  type MatchRuntime,
} from './registry.js';
import { armTurnTimer } from './timers.js';

export interface MatchService {
  /** Arranque inmediato en cuanto todos los asientos confirman — sin cuenta atrás. */
  startNow(matchId: string): Promise<void>;
  broadcastLobby(matchId: string): Promise<void>;
  attachPlayer(socket: AuthedSocket, matchId: string): Promise<void>;
  attachSpectator(socket: AuthedSocket, matchId: string): Promise<void>;
  detachSocket(socket: AuthedSocket): void;
  handleMove(socket: AuthedSocket, matchId: string, rawMove: unknown): Promise<void>;
  handleChat(socket: AuthedSocket, matchId: string, body: string): Promise<void>;
  recoverOnBoot(): Promise<void>;
}

export function createMatchService(db: Db): MatchService {
  const runtimes = new Map<string, MatchRuntime>();

  async function ensureRuntime(matchId: string): Promise<MatchRuntime | null> {
    const existing = runtimes.get(matchId);
    if (existing) return existing;

    const [row] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
    if (!row) return null;

    const def = getGameDefinition(row.gameId);
    const turnDurationS = row.turnDurationS ?? def?.ui.defaultTurnSeconds ?? 30;
    const runtime = createEmptyRuntime(
      matchId,
      row.code,
      row.gameId,
      row.maxPlayers,
      turnDurationS,
      row.mode,
      (row.options as Record<string, unknown> | null) ?? null,
    );
    runtimes.set(matchId, runtime);

    if (def && (row.state === 'in_game' || row.state === 'finished')) {
      const loaded = await loadEngineState(db, def, matchId);
      if (loaded) runtime.engine = { def, state: loaded.state, seq: loaded.seq };
    }

    return runtime;
  }

  async function syncAfterAttach(socket: AuthedSocket, runtime: MatchRuntime): Promise<void> {
    if (runtime.engine) {
      await sendChatHistory(db, runtime.matchId, socket);
      await broadcastState(db, runtime);
    } else {
      await broadcastLobby(db, runtime);
    }
  }

  return {
    async startNow(matchId) {
      const runtime = await ensureRuntime(matchId);
      if (runtime) await startMatch(db, runtime);
    },

    async broadcastLobby(matchId) {
      const runtime = await ensureRuntime(matchId);
      if (runtime) await broadcastLobby(db, runtime);
    },

    async attachPlayer(socket, matchId) {
      const runtime = await ensureRuntime(matchId);
      if (!runtime) return sendError(socket, 'MATCH_NOT_FOUND', 'La partida no existe');

      const [seatRow] = await db
        .select({ seat: matchPlayers.seat })
        .from(matchPlayers)
        .where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.userId, socket.userId)))
        .limit(1);
      if (!seatRow) return sendError(socket, 'SEAT_NOT_FOUND', 'No estás sentado en esta partida');

      addPlayerSocket(runtime, seatRow.seat, socket);
      socket.currentMatchId = matchId;
      await db
        .update(matchPlayers)
        .set({ disconnectedAt: null })
        .where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.userId, socket.userId)));

      await syncAfterAttach(socket, runtime);
    },

    async attachSpectator(socket, matchId) {
      const runtime = await ensureRuntime(matchId);
      if (!runtime) return sendError(socket, 'MATCH_NOT_FOUND', 'La partida no existe');

      runtime.sockets.spectators.add(socket);
      socket.currentMatchId = matchId;
      await db.insert(matchSpectators).values({ matchId, userId: socket.userId }).onConflictDoNothing();

      await syncAfterAttach(socket, runtime);
    },

    detachSocket(socket) {
      const matchId = socket.currentMatchId;
      if (!matchId) return;
      const runtime = runtimes.get(matchId);
      if (!runtime) return;

      for (const [seat, sockets] of runtime.sockets.players) {
        if (sockets.has(socket)) {
          void db
            .update(matchPlayers)
            .set({ disconnectedAt: new Date() })
            .where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.seat, seat)));
        }
      }
      removeSocketEverywhere(runtime, socket);
      socket.currentMatchId = null;
    },

    async handleMove(socket, matchId, rawMove) {
      const runtime = await ensureRuntime(matchId);
      if (!runtime) return sendError(socket, 'MATCH_NOT_FOUND', 'La partida no existe');

      const [seatRow] = await db
        .select({ seat: matchPlayers.seat })
        .from(matchPlayers)
        .where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.userId, socket.userId)))
        .limit(1);
      if (!seatRow) return sendError(socket, 'SEAT_NOT_FOUND', 'No estás sentado en esta partida');

      const outcome = await applyPlayerMove(db, runtime, seatRow.seat, rawMove);
      if (!outcome.ok) sendError(socket, outcome.code, 'Movimiento no válido');
    },

    async handleChat(socket, matchId, body) {
      const runtime = await ensureRuntime(matchId);
      if (!runtime) return sendError(socket, 'MATCH_NOT_FOUND', 'La partida no existe');

      const [inserted] = await db
        .insert(matchChatMessages)
        .values({ matchId, userId: socket.userId, body })
        .returning();
      if (!inserted) return;

      broadcastChat(runtime, {
        id: inserted.id,
        userId: socket.userId,
        username: socket.username,
        body: inserted.body,
        createdAt: inserted.createdAt,
      });
    },

    async recoverOnBoot() {
      // Nota: un solo proceso Node arrancando en frío no tiene con quién
      // disputarse el bloqueo — el `FOR UPDATE SKIP LOCKED` documentado en la
      // arquitectura solo aporta valor real con varias instancias del server
      // corriendo a la vez (horizontal scaling, fuera de alcance hasta M6+).
      const rows = await db.select().from(matches).where(eq(matches.state, 'in_game'));

      const now = new Date();
      for (const row of rows) {
        const runtime = await ensureRuntime(row.id);
        if (!runtime?.engine) continue;

        if (row.turnDeadlineAt && row.turnDeadlineAt <= now) {
          await handleTurnTimeout(db, runtime);
        } else if (row.turnDeadlineAt) {
          armTurnTimer(runtime, row.turnDeadlineAt, () => {
            void handleTurnTimeout(db, runtime).catch((err: unknown) => console.error('handleTurnTimeout falló', err));
          });
        }
      }

      // Partidas atascadas en 'starting' por un crash a mitad de countdown: vuelven a 'waiting'.
      await db.update(matches).set({ state: 'waiting' }).where(eq(matches.state, 'starting'));
    },
  };
}
