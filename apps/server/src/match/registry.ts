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
  code: string;
  gameId: string;
  maxPlayers: number;
  /** null = partida "sin tiempo": nunca se arma temporizador de turno ni hay forfeit por reloj. */
  turnDurationS: number | null;
  /** realtime: no se avisa de cambio de turno (ambos jugadores ya están mirando el tablero); async: sí. */
  mode: 'realtime' | 'async';
  /** Config específica del juego (p.ej. variante elegida) — se pasa tal cual a `setup()`. */
  options: Record<string, unknown> | null;
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
  /** Asientos que han pedido cortar la partida por abandono mutuo (transitorio, no persistido) —
   * se efectúa en cuanto coincide con todos los asientos sentados. */
  abandonRequests: Set<number>;
}

export function createEmptyRuntime(
  matchId: string,
  code: string,
  gameId: string,
  maxPlayers: number,
  turnDurationS: number | null,
  mode: 'realtime' | 'async',
  options: Record<string, unknown> | null,
): MatchRuntime {
  return {
    matchId,
    code,
    gameId,
    maxPlayers,
    turnDurationS,
    mode,
    options,
    engine: null,
    sockets: { players: new Map(), spectators: new Set() },
    turnTimer: null,
    readyTimer: null,
    readyCheckEndsAt: null,
    abandonRequests: new Set(),
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
