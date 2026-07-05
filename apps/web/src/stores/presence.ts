import { create } from 'zustand';
import type { ServerMessage } from '@tableria/protocol';
import { matchSocket } from '../lib/ws';

export type PresenceValue = 'online' | 'away' | 'in_game' | 'offline';

export interface PresenceEntry {
  presence: PresenceValue;
  lastSeenAt: string | null;
}

interface PresenceStoreState {
  byUserId: Record<string, PresenceEntry>;
}

export const usePresenceStore = create<PresenceStoreState>(() => ({ byUserId: {} }));

function handleMessage(message: ServerMessage): void {
  switch (message.type) {
    case 'presence.snapshot':
      usePresenceStore.setState({
        byUserId: Object.fromEntries(
          message.payload.friends.map((f) => [f.userId, { presence: f.presence, lastSeenAt: f.lastSeenAt }]),
        ),
      });
      return;
    case 'presence.update':
      usePresenceStore.setState((s) => ({
        byUserId: {
          ...s.byUserId,
          [message.payload.userId]: { presence: message.payload.presence, lastSeenAt: message.payload.lastSeenAt },
        },
      }));
      return;
  }
}

matchSocket.onMessage(handleMessage);
