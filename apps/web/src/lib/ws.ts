import { serverMessageSchema, type ClientMessage, type ServerMessage } from '@tableria/protocol';

export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

type MessageListener = (message: ServerMessage) => void;
type StatusListener = (status: ConnectionStatus) => void;

const MAX_BACKOFF_MS = 8000;
const BASE_BACKOFF_MS = 500;

/**
 * Wrapper sobre WebSocket nativo: reconexión con backoff exponencial + jitter,
 * y reenvío automático de la última suscripción (match.join/watch/resume) en
 * cada reconexión — así "matar el servidor a mitad de partida" es transparente
 * para quien esté usando el store de partida.
 */
class MatchSocket {
  private ws: WebSocket | null = null;
  private messageListeners = new Set<MessageListener>();
  private statusListeners = new Set<StatusListener>();
  private lastSubscription: ClientMessage | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private status: ConnectionStatus = 'closed';

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/api/ws`);
    this.ws = ws;

    ws.addEventListener('open', () => {
      this.reconnectAttempt = 0;
      this.setStatus('open');
      if (this.lastSubscription) this.send(this.lastSubscription);
    });

    ws.addEventListener('message', (event: MessageEvent<string>) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data);
      } catch {
        return;
      }
      const result = serverMessageSchema.safeParse(parsed);
      if (!result.success) return;
      for (const listener of this.messageListeners) listener(result.data);
    });

    ws.addEventListener('close', () => {
      if (this.ws !== ws) return; // ya reemplazado por una conexión más nueva
      this.ws = null;
      this.setStatus('reconnecting');
      this.scheduleReconnect();
    });

    ws.addEventListener('error', () => ws.close());
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    const delay = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** this.reconnectAttempt) * (0.75 + Math.random() * 0.5);
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  /** Suscripción "recordada": se reenvía sola tras cada reconexión. */
  subscribe(message: ClientMessage): void {
    this.lastSubscription = message;
    this.connect();
    this.send(message);
  }

  send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message));
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  reset(): void {
    this.lastSubscription = null;
  }
}

export const matchSocket = new MatchSocket();
