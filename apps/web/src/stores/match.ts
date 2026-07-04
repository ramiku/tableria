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
  reset(): void;
}

export const useMatchStore = create<MatchStoreState>((set) => ({
  connectionStatus: matchSocket.getStatus(),
  lobby: null,
  matchState: null,
  ended: null,
  chat: [],
  reset: () => set({ lobby: null, matchState: null, ended: null, chat: [] }),
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
      useMatchStore.setState({ ended: message.payload });
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
      return;
  }
}

matchSocket.onMessage(handleMessage);
matchSocket.onStatus((status) => useMatchStore.setState({ connectionStatus: status }));
