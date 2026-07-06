import type { Db } from '@tableria/db';
import type { ClientMessage, ServerMessage, VoiceRoom } from '@tableria/protocol';
import { isSeated, type MatchService } from '../match/service.js';
import type { AuthedSocket } from '../match/registry.js';
import * as conversations from '../social/conversations.js';
import { socketsFor } from '../social/presence.js';
import { sendToSocket } from '../ws/send.js';
import { joinRoom, leaveRoom, removeSocketEverywhere, socketsInRoom } from './rooms.js';

type VoiceSignal = Extract<ClientMessage, { type: 'voice.signal' }>['payload']['signal'];

export interface VoiceService {
  joinCall(socket: AuthedSocket, room: VoiceRoom): Promise<void>;
  leaveCall(socket: AuthedSocket, room: VoiceRoom): void;
  relaySignal(socket: AuthedSocket, room: VoiceRoom, targetUserId: string, signal: VoiceSignal): Promise<void>;
  /** Envía el roster actual de `room` a una única socket, sin esperar al próximo join/leave —
   * así quien acaba de entrar a una partida ve de inmediato si ya hay una llamada en curso. */
  sendRosterSnapshot(socket: AuthedSocket, room: VoiceRoom): void;
  detachSocket(socket: AuthedSocket): void;
}

async function isAuthorized(db: Db, room: VoiceRoom, userId: string): Promise<boolean> {
  return room.kind === 'conversation' ? conversations.isMember(db, room.conversationId, userId) : isSeated(db, room.matchId, userId);
}

export function createVoiceService(db: Db, matchService: MatchService): VoiceService {
  function rosterMessage(room: VoiceRoom): ServerMessage {
    const participants = [...socketsInRoom(room)].map((s) => ({ userId: s.userId, username: s.username }));
    return { type: 'voice.roster', payload: { room, participants } };
  }

  function broadcastRoster(room: VoiceRoom): void {
    const message = rosterMessage(room);
    // Para partidas, el roster también llega a quien solo está mirando (sin haberse unido a la
    // llamada) — así el rival ve que hay una llamada activa y puede decidir unirse.
    const recipients =
      room.kind === 'match'
        ? new Set([...socketsInRoom(room), ...matchService.getMatchSockets(room.matchId)])
        : socketsInRoom(room);
    for (const socket of recipients) sendToSocket(socket, message);
  }

  return {
    async joinCall(socket, room) {
      if (!(await isAuthorized(db, room, socket.userId))) throw new Error('No perteneces a esta sala de voz');
      joinRoom(room, socket);
      broadcastRoster(room);
    },

    leaveCall(socket, room) {
      leaveRoom(room, socket);
      broadcastRoster(room);
    },

    // El servidor no interpreta el SDP/candidato ICE — solo reenvía la señal al destinatario.
    async relaySignal(socket, room, targetUserId, signal) {
      if (!(await isAuthorized(db, room, socket.userId))) return;
      const message: ServerMessage = {
        type: 'voice.signal',
        payload: { room, fromUserId: socket.userId, signal },
      };
      for (const target of socketsFor(targetUserId)) sendToSocket(target, message);
    },

    sendRosterSnapshot(socket, room) {
      sendToSocket(socket, rosterMessage(room));
    },

    detachSocket(socket) {
      const affected = removeSocketEverywhere(socket);
      for (const room of affected) broadcastRoster(room);
    },
  };
}
