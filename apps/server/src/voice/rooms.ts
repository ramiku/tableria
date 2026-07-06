import type { VoiceRoom } from '@tableria/protocol';
import type { AuthedSocket } from '../match/registry.js';

/**
 * Estado en memoria de quién está conectado a cada llamada de voz ahora mismo — efímero,
 * no se persiste (mismo espíritu que `match/registry.ts`: la voz de una malla P2P no tiene
 * sentido fuera del proceso que la coordina). Una sala es una conversación de grupo o una
 * partida; se guarda junto a sus sockets para poder recuperarla tal cual al limpiar.
 */
interface RoomEntry {
  room: VoiceRoom;
  sockets: Set<AuthedSocket>;
}

const rooms = new Map<string, RoomEntry>();

function roomKey(room: VoiceRoom): string {
  return room.kind === 'conversation' ? `conversation:${room.conversationId}` : `match:${room.matchId}`;
}

export function joinRoom(room: VoiceRoom, socket: AuthedSocket): void {
  const key = roomKey(room);
  let entry = rooms.get(key);
  if (!entry) {
    entry = { room, sockets: new Set() };
    rooms.set(key, entry);
  }
  entry.sockets.add(socket);
}

export function leaveRoom(room: VoiceRoom, socket: AuthedSocket): void {
  const key = roomKey(room);
  const entry = rooms.get(key);
  if (!entry) return;
  entry.sockets.delete(socket);
  if (entry.sockets.size === 0) rooms.delete(key);
}

export function socketsInRoom(room: VoiceRoom): Set<AuthedSocket> {
  return rooms.get(roomKey(room))?.sockets ?? new Set();
}

/** Saca la socket de cualquier sala en la que estuviera — llamado al cerrar la conexión. */
export function removeSocketEverywhere(socket: AuthedSocket): VoiceRoom[] {
  const affected: VoiceRoom[] = [];
  for (const [key, entry] of rooms) {
    if (entry.sockets.delete(socket)) {
      affected.push(entry.room);
      if (entry.sockets.size === 0) rooms.delete(key);
    }
  }
  return affected;
}
