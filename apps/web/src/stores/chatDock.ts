import { create } from 'zustand';

/**
 * Chat flotante global (dock abajo-derecha). Cualquier parte de la app puede
 * abrir una conversación aquí (icono de chat de un amigo, burbuja de mensaje
 * entrante) sin navegar — la página /mensajes sigue existiendo pero el dock
 * es el camino principal.
 *
 * Ciclo de vida: abierto (panel) → minimizado (burbuja, la X del panel) →
 * cerrado del todo (la X de la burbuja).
 */
interface ChatDockState {
  conversationId: string | null;
  /** Nombre a mostrar mientras la conversación aún no está en la caché de la lista. */
  fallbackName: string | null;
  /** true = solo burbuja; false = panel abierto. */
  minimized: boolean;
  openChat(conversationId: string, fallbackName?: string): void;
  /** Panel → burbuja (la conversación sigue "colgada" abajo a la derecha). */
  minimizeChat(): void;
  /** Quita también la burbuja. */
  closeChat(): void;
}

export const useChatDock = create<ChatDockState>((set) => ({
  conversationId: null,
  fallbackName: null,
  minimized: false,
  openChat: (conversationId, fallbackName) =>
    set((s) => ({ conversationId, fallbackName: fallbackName ?? (s.conversationId === conversationId ? s.fallbackName : null), minimized: false })),
  minimizeChat: () => set({ minimized: true }),
  closeChat: () => set({ conversationId: null, fallbackName: null, minimized: false }),
}));
