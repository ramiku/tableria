import { create } from 'zustand';
import type { ServerMessage } from '@tableria/protocol';
import { matchSocket, type ConnectionStatus } from '../lib/ws';

type LobbyPayload = Extract<ServerMessage, { type: 'match.lobby' }>['payload'];
type StatePayload = Extract<ServerMessage, { type: 'match.state' }>['payload'];
type EndedPayload = Extract<ServerMessage, { type: 'match.ended' }>['payload'];
type ChatEntry = Extract<ServerMessage, { type: 'chat.history' }>['payload']['messages'][number];

interface MatchStoreState {
  connectionStatus: ConnectionStatus;
  lobby: LobbyPayload | null;
  matchState: StatePayload | null;
  ended: EndedPayload | null;
  chat: ChatEntry[];
  /** Asientos que han pedido cortar la partida por abandono mutuo (vacío = nadie lo ha pedido). */
  abandonRequestedSeats: number[];
  /** Último error de mensaje bloqueado por lenguaje (chat de mesa o DM) — para avisar en la UI. */
  chatBlockedError: string | null;
  clearChatBlockedError(): void;
  reset(): void;
}

export const useMatchStore = create<MatchStoreState>((set) => ({
  connectionStatus: matchSocket.getStatus(),
  lobby: null,
  matchState: null,
  ended: null,
  chat: [],
  abandonRequestedSeats: [],
  chatBlockedError: null,
  clearChatBlockedError: () => set({ chatBlockedError: null }),
  reset: () => set({ lobby: null, matchState: null, ended: null, chat: [], abandonRequestedSeats: [] }),
}));

function handleMessage(message: ServerMessage): void {
  switch (message.type) {
    case 'match.lobby':
      useMatchStore.setState({ lobby: message.payload, ended: null });
      return;
    case 'match.state':
      useMatchStore.setState({ matchState: message.payload, lobby: null });
      return;
    case 'match.ended':
      useMatchStore.setState({ ended: message.payload, abandonRequestedSeats: [] });
      return;
    case 'match.abandonStatus':
      useMatchStore.setState({ abandonRequestedSeats: message.payload.requestedSeats });
      return;
    case 'chat.message': {
      const { id, userId, username, body, createdAt } = message.payload;
      useMatchStore.setState((s) => ({ chat: [...s.chat, { id, userId, username, body, createdAt }] }));
      return;
    }
    case 'chat.history':
      useMatchStore.setState({ chat: message.payload.messages });
      return;
    case 'match.error':
      console.error('[match.error]', message.payload.code, message.payload.message);
      if (message.payload.code === 'BLOCKED_LANGUAGE') {
        useMatchStore.setState({ chatBlockedError: message.payload.message });
      }
      return;
  }
}

// Ver el comentario equivalente en `stores/presence.ts`: sin este dispose, cada HMR de este
// archivo apila un listener más sobre el socket singleton — cada `chat.message` entrante se
// procesaría una vez por listener acumulado, viéndose como mensajes duplicados (solo en dev).
const unsubscribeMessage = matchSocket.onMessage(handleMessage);
const unsubscribeStatus = matchSocket.onStatus((status) => useMatchStore.setState({ connectionStatus: status }));
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubscribeMessage();
    unsubscribeStatus();
  });
}
