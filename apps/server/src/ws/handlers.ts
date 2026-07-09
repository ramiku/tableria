import type { ClientMessage } from '@tableria/protocol';
import type { AuthedSocket } from '../match/registry.js';
import type { MatchService } from '../match/service.js';
import type { SocialService } from '../social/service.js';
import type { VoiceService } from '../voice/service.js';

export async function dispatchClientMessage(
  service: MatchService,
  social: SocialService,
  voice: VoiceService,
  socket: AuthedSocket,
  message: ClientMessage,
): Promise<void> {
  switch (message.type) {
    case 'match.join':
    case 'match.resume':
      await service.attachPlayer(socket, message.payload.matchId);
      // Ver de inmediato si ya hay una llamada de voz activa en esta partida, sin esperar
      // al próximo join/leave de otro jugador.
      voice.sendRosterSnapshot(socket, { kind: 'match', matchId: message.payload.matchId });
      return;
    case 'match.watch':
      await service.attachSpectator(socket, message.payload.matchId);
      return;
    case 'match.move':
      await service.handleMove(socket, message.payload.matchId, message.payload.move);
      return;
    case 'chat.send':
      await service.handleChat(socket, message.payload.matchId, message.payload.body);
      return;
    case 'dm.send':
      await social.sendDirectMessage(socket, message.payload.conversationId, message.payload.body, message.payload.kind, message.payload.matchId);
      return;
    case 'match.forfeit':
      await service.handleForfeit(socket, message.payload.matchId);
      return;
    case 'match.claimTimeoutVictory':
      await service.handleClaimTimeoutVictory(socket, message.payload.matchId);
      return;
    case 'match.abandonRequest':
      await service.handleAbandonRequest(socket, message.payload.matchId);
      return;
    case 'match.abandonCancel':
      await service.handleAbandonCancel(socket, message.payload.matchId);
      return;
    case 'voice.join':
      await voice.joinCall(socket, message.payload.room);
      return;
    case 'voice.leave':
      voice.leaveCall(socket, message.payload.room);
      return;
    case 'voice.signal':
      await voice.relaySignal(socket, message.payload.room, message.payload.targetUserId, message.payload.signal);
      return;
  }
}
