import type { GameDefinition } from '@tableria/engine';
import type { WebSocket } from 'ws';

/** Socket ya autenticado en el handshake — ver `ws/gateway.ts`. */
export interface AuthedSocket extends WebSocket {
  userId: string;
  username: string;
  /** Token opaco de sesión (no el hash) — el heartbeat lo revalida periódicamente. */
  sessionToken: string;
  isAlive: boolean;
  /** matchId al que está suscrito ahora mismo (join/watch/resume), para poder limpiar en O(1) al cerrar. */
  currentMatchId: string | null;
}

export interface EngineRuntime {
  def: GameDefinition<unknown, unknown>;
  state: unknown;
  seq: number;
}

export interface MatchRuntime {
  matchId: string;
  gameId: string;
  maxPlayers: number;
  turnDurationS: number;
  /** null mientras la partida está en waiting/starting (aún no hay setup()). */
  engine: EngineRuntime | null;
  sockets: {
    players: Map<number, Set<AuthedSocket>>;
    spectators: Set<AuthedSocket>;
  };
  turnTimer: NodeJS.Timeout | null;
  readyTimer: NodeJS.Timeout | null;
  /** Instante en el que termina la cuenta atrás de 20s del ready-check (transitorio, no persistido). */
  readyCheckEndsAt: Date | null;
}

export function createEmptyRuntime(
  matchId: string,
  gameId: string,
  maxPlayers: number,
  turnDurationS: number,
): MatchRuntime {
  return {
    matchId,
    gameId,
    maxPlayers,
    turnDurationS,
    engine: null,
    sockets: { players: new Map(), spectators: new Set() },
    turnTimer: null,
    readyTimer: null,
    readyCheckEndsAt: null,
  };
}

export function addPlayerSocket(runtime: MatchRuntime, seat: number, socket: AuthedSocket): void {
  let set = runtime.sockets.players.get(seat);
  if (!set) {
    set = new Set();
    runtime.sockets.players.set(seat, set);
  }
  set.add(socket);
}

export function removeSocketEverywhere(runtime: MatchRuntime, socket: AuthedSocket): void {
  for (const set of runtime.sockets.players.values()) set.delete(socket);
  runtime.sockets.spectators.delete(socket);
}

export function allSockets(runtime: MatchRuntime): AuthedSocket[] {
  const out: AuthedSocket[] = [...runtime.sockets.spectators];
  for (const set of runtime.sockets.players.values()) out.push(...set);
  return out;
}
