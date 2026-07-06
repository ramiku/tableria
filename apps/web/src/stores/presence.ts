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

// `import.meta.hot.dispose` deshace la suscripción de la instancia saliente del módulo antes
// de que Vite ejecute la nueva tras un HMR — sin esto, cada recarga en caliente de este archivo
// (o de algo que lo re-evalúe) apila un listener más sobre el socket singleton, y cada mensaje
// entrante acaba procesándose una vez por listener acumulado (duplicados solo en dev).
const unsubscribe = matchSocket.onMessage(handleMessage);
if (import.meta.hot) import.meta.hot.dispose(() => unsubscribe());
