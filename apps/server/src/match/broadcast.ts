import { asc, eq, matchChatMessages, matchPlayers, matches, users, type Db } from '@tableria/db';
import type { PlayerRank } from '@tableria/engine';
import type { ServerMessage } from '@tableria/protocol';
import type { RatingDeltas } from '../ratings/service.js';
import { sendToSocket as send } from '../ws/send.js';
import { allSockets, type AuthedSocket, type MatchRuntime } from './registry.js';

export function sendError(socket: AuthedSocket, code: string, message: string): void {
  send(socket, { type: 'match.error', payload: { code, message } });
}

/** Difunde la sala de espera (asientos/ready/countdown) a todo el que esté suscrito. */
export async function broadcastLobby(db: Db, runtime: MatchRuntime): Promise<void> {
  const [matchRow] = await db
    .select({ state: matches.state })
    .from(matches)
    .where(eq(matches.id, runtime.matchId))
    .limit(1);
  if (!matchRow || (matchRow.state !== 'waiting' && matchRow.state !== 'starting' && matchRow.state !== 'cancelled')) {
    return;
  }

  const rows = await db
    .select({
      seat: matchPlayers.seat,
      ready: matchPlayers.ready,
      userId: matchPlayers.userId,
      username: users.username,
      avatarInitial: users.avatarInitial,
      avatarColor: users.avatarColor,
    })
    .from(matchPlayers)
    .innerJoin(users, eq(matchPlayers.userId, users.id))
    .where(eq(matchPlayers.matchId, runtime.matchId))
    .orderBy(matchPlayers.seat);

  const seats = Array.from({ length: runtime.maxPlayers }, (_, seat) => {
    const row = rows.find((r) => r.seat === seat);
    return {
      seat,
      userId: row?.userId ?? null,
      username: row?.username ?? null,
      avatarInitial: row?.avatarInitial ?? null,
      avatarColor: row?.avatarColor ?? null,
      ready: row?.ready ?? false,
      connected: row ? (runtime.sockets.players.get(seat)?.size ?? 0) > 0 : false,
    };
  });

  const message: ServerMessage = {
    type: 'match.lobby',
    payload: {
      matchId: runtime.matchId,
      state: matchRow.state,
      maxPlayers: runtime.maxPlayers,
      seats,
      startsAt: runtime.readyCheckEndsAt ? runtime.readyCheckEndsAt.toISOString() : null,
    },
  };

  for (const socket of allSockets(runtime)) send(socket, message);
}

/** Difunde el estado de la partida en curso: vista por asiento + vista pública a espectadores. */
export async function broadcastState(db: Db, runtime: MatchRuntime): Promise<void> {
  if (!runtime.engine) return;
  const { def, state, seq } = runtime.engine;

  const rows = await db
    .select({ seat: matchPlayers.seat, userId: matchPlayers.userId, username: users.username })
    .from(matchPlayers)
    .innerJoin(users, eq(matchPlayers.userId, users.id))
    .where(eq(matchPlayers.matchId, runtime.matchId))
    .orderBy(matchPlayers.seat);

  const players = rows.map((r) => ({
    seat: r.seat,
    userId: r.userId,
    username: r.username,
    connected: (runtime.sockets.players.get(r.seat)?.size ?? 0) > 0,
  }));

  const [matchRow] = await db
    .select({ turnDeadlineAt: matches.turnDeadlineAt })
    .from(matches)
    .where(eq(matches.id, runtime.matchId))
    .limit(1);
  const turnDeadlineAt = matchRow?.turnDeadlineAt ? matchRow.turnDeadlineAt.toISOString() : null;
  const activePlayers = def.activePlayers(state);

  for (const [seat, sockets] of runtime.sockets.players) {
    const message: ServerMessage = {
      type: 'match.state',
      payload: { matchId: runtime.matchId, seq, view: def.playerView(state, seat), turnDeadlineAt, activePlayers, players },
    };
    for (const socket of sockets) send(socket, message);
  }

  if (runtime.sockets.spectators.size > 0) {
    const message: ServerMessage = {
      type: 'match.state',
      payload: { matchId: runtime.matchId, seq, view: def.playerView(state, null), turnDeadlineAt, activePlayers, players },
    };
    for (const socket of runtime.sockets.spectators) send(socket, message);
  }
}

export function broadcastEnded(
  runtime: MatchRuntime,
  reason: 'completed' | 'forfeit' | 'abandoned',
  ranking: PlayerRank[],
  ratingDeltas: RatingDeltas,
): void {
  const ratingDeltasPayload =
    ratingDeltas.size > 0 ? Array.from(ratingDeltas.entries()).map(([seat, d]) => ({ seat, ...d })) : null;
  const message: ServerMessage = {
    type: 'match.ended',
    payload: { matchId: runtime.matchId, reason, ranking, ratingDeltas: ratingDeltasPayload },
  };
  for (const socket of allSockets(runtime)) send(socket, message);
}

/** Estado en vivo de quién ha pedido cortar la partida por abandono mutuo. */
export function broadcastAbandonStatus(runtime: MatchRuntime): void {
  const message: ServerMessage = {
    type: 'match.abandonStatus',
    payload: { matchId: runtime.matchId, requestedSeats: Array.from(runtime.abandonRequests) },
  };
  for (const socket of allSockets(runtime)) send(socket, message);
}

export async function sendChatHistory(db: Db, matchId: string, socket: AuthedSocket): Promise<void> {
  const rows = await db
    .select({
      id: matchChatMessages.id,
      userId: matchChatMessages.userId,
      username: users.username,
      body: matchChatMessages.body,
      createdAt: matchChatMessages.createdAt,
    })
    .from(matchChatMessages)
    .innerJoin(users, eq(matchChatMessages.userId, users.id))
    .where(eq(matchChatMessages.matchId, matchId))
    .orderBy(asc(matchChatMessages.createdAt))
    .limit(50);

  send(socket, {
    type: 'chat.history',
    payload: {
      matchId,
      messages: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    },
  });
}

export function broadcastChat(
  runtime: MatchRuntime,
  entry: { id: string; userId: string; username: string; body: string; createdAt: Date },
): void {
  const message: ServerMessage = {
    type: 'chat.message',
    payload: { matchId: runtime.matchId, ...entry, createdAt: entry.createdAt.toISOString() },
  };
  for (const socket of allSockets(runtime)) send(socket, message);
}
