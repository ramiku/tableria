import type { ClientMessage } from '@tableria/protocol';
import type { AuthedSocket } from '../match/registry.js';
import type { MatchService } from '../match/service.js';

export async function dispatchClientMessage(
  service: MatchService,
  socket: AuthedSocket,
  message: ClientMessage,
): Promise<void> {
  switch (message.type) {
    case 'match.join':
    case 'match.resume':
      await service.attachPlayer(socket, message.payload.matchId);
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
  }
}
