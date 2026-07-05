import type { ServerMessage } from '@tableria/protocol';
import type { AuthedSocket } from '../match/registry.js';

export function sendToSocket(socket: AuthedSocket, message: ServerMessage): void {
  if (socket.readyState !== socket.OPEN) return;
  socket.send(JSON.stringify(message));
}
