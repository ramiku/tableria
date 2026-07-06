import { create } from 'zustand';
import type { ServerMessage } from '@tableria/protocol';
import { matchSocket } from '../lib/ws';

type NotificationPayload = Extract<ServerMessage, { type: 'notification.new' }>['payload'];

export interface NotificationItem {
  id: string;
  type: NotificationPayload['type'];
  payload?: unknown;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsState {
  items: NotificationItem[];
  setInitial(items: NotificationItem[]): void;
  markRead(id: string): void;
  markAllRead(): void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  setInitial: (items) => set({ items }),
  markRead: (id) =>
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)),
    })),
  markAllRead: () =>
    set((s) => ({ items: s.items.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) })),
}));

function handleMessage(message: ServerMessage): void {
  if (message.type !== 'notification.new') return;
  const { id, type, payload, createdAt } = message.payload;
  useNotificationsStore.setState((s) => ({ items: [{ id, type, payload, readAt: null, createdAt }, ...s.items] }));
}

// Ver el comentario equivalente en `stores/presence.ts`: sin este dispose, cada HMR de este
// archivo apila un listener más sobre el socket singleton (duplicados solo en dev).
const unsubscribe = matchSocket.onMessage(handleMessage);
if (import.meta.hot) import.meta.hot.dispose(() => unsubscribe());
