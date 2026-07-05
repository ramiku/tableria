import { eq, or, users, type Db } from '@tableria/db';
import type { ServerMessage } from '@tableria/protocol';
import type { AuthedSocket } from '../match/registry.js';
import { sendToSocket as send } from '../ws/send.js';
import { listFriendIds } from './friends.js';

/** Espera corta antes de pasar a `offline` tras el último socket de un usuario, para no parpadear en reconexiones breves. */
const OFFLINE_GRACE_MS = 10_000;

type PresenceValue = 'online' | 'away' | 'in_game' | 'offline';

const socketsByUser = new Map<string, Set<AuthedSocket>>();
const offlineTimers = new Map<string, NodeJS.Timeout>();

export function socketsFor(userId: string): Set<AuthedSocket> {
  return socketsByUser.get(userId) ?? new Set();
}

export function isOnline(userId: string): boolean {
  return socketsFor(userId).size > 0;
}

export async function broadcastPresence(db: Db, userId: string, presence: PresenceValue, lastSeenAt: Date | null): Promise<void> {
  const friendIds = await listFriendIds(db, userId);
  if (friendIds.length === 0) return;
  const message: ServerMessage = {
    type: 'presence.update',
    payload: { userId, presence, lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : null },
  };
  for (const friendId of friendIds) {
    for (const socket of socketsFor(friendId)) send(socket, message);
  }
}

export async function sendPresenceSnapshot(db: Db, socket: AuthedSocket): Promise<void> {
  const friendIds = await listFriendIds(db, socket.userId);
  if (friendIds.length === 0) {
    send(socket, { type: 'presence.snapshot', payload: { friends: [] } });
    return;
  }
  const rows = await db
    .select({ id: users.id, presence: users.presence, lastSeenAt: users.lastSeenAt })
    .from(users)
    .where(or(...friendIds.map((id) => eq(users.id, id))));
  send(socket, {
    type: 'presence.snapshot',
    payload: {
      friends: rows.map((r) => ({
        userId: r.id,
        presence: r.presence,
        lastSeenAt: r.lastSeenAt ? r.lastSeenAt.toISOString() : null,
      })),
    },
  });
}

/** Registra el socket al autenticar; si es el primero del usuario, pasa a `online` y avisa a sus amigos. */
export async function attach(db: Db, socket: AuthedSocket): Promise<void> {
  const pendingOffline = offlineTimers.get(socket.userId);
  if (pendingOffline) {
    clearTimeout(pendingOffline);
    offlineTimers.delete(socket.userId);
  }

  let set = socketsByUser.get(socket.userId);
  const wasOffline = !set || set.size === 0;
  if (!set) {
    set = new Set();
    socketsByUser.set(socket.userId, set);
  }
  set.add(socket);

  if (wasOffline) {
    const now = new Date();
    await db.update(users).set({ presence: 'online', lastSeenAt: now }).where(eq(users.id, socket.userId));
    await broadcastPresence(db, socket.userId, 'online', now);
  }

  await sendPresenceSnapshot(db, socket);
}

/** Quita el socket; si era el último del usuario, programa el paso a `offline` tras el grace period. */
export function detach(db: Db, socket: AuthedSocket): void {
  const set = socketsByUser.get(socket.userId);
  if (!set) return;
  set.delete(socket);
  if (set.size > 0) return;
  socketsByUser.delete(socket.userId);

  const timer = setTimeout(() => {
    offlineTimers.delete(socket.userId);
    void (async () => {
      if (isOnline(socket.userId)) return; // reconectó durante el grace period
      const now = new Date();
      await db.update(users).set({ presence: 'offline', lastSeenAt: now }).where(eq(users.id, socket.userId));
      await broadcastPresence(db, socket.userId, 'offline', now);
    })().catch((err: unknown) => console.error('Error al marcar presencia offline', err));
  }, OFFLINE_GRACE_MS);
  timer.unref();
  offlineTimers.set(socket.userId, timer);
}

/** Usado por el motor de partidas (M2) para reflejar cuándo un jugador está sentado en una mesa en curso. */
export async function setInGame(db: Db, userIds: string[], inGame: boolean): Promise<void> {
  for (const userId of userIds) {
    if (!isOnline(userId)) continue; // el próximo ciclo connect/disconnect ya fijará su presencia real
    const presence: PresenceValue = inGame ? 'in_game' : 'online';
    const now = new Date();
    await db.update(users).set({ presence, lastSeenAt: now }).where(eq(users.id, userId));
    await broadcastPresence(db, userId, presence, now);
  }
}
