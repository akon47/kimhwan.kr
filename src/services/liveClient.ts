import type { CanvasBoard, ClientMessages, DeployEvent, ServerMessages } from '@/types/live';

type ServerType = keyof ServerMessages;
type Handler<T extends ServerType> = (payload: ServerMessages[T]) => void;

const PING_INTERVAL_MS = 25_000;
const RECONNECT_MIN_MS = 1_000;
const RECONNECT_MAX_MS = 60_000;

function socketUrl(): string {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${location.host}/api/live/ws`;
}

/**
 * WebSocket connection to the realtime backend. Reconnects by itself with exponential backoff, so callers
 * only subscribe and send; messages sent while offline are dropped (everything here is ephemeral).
 * The site works without it: if the backend is down, the live extras simply stay hidden.
 */
export class LiveClient {
  private socket: WebSocket | null = null;
  private readonly handlers = new Map<ServerType, Set<Handler<ServerType>>>();
  private readonly statusListeners = new Set<(connected: boolean) => void>();
  private reconnectDelay = RECONNECT_MIN_MS;
  private reconnectTimer: number | undefined;
  private pingTimer: number | undefined;
  private started = false;

  /** Opens the connection and keeps it open. Safe to call more than once. */
  start() {
    if (this.started) {
      return;
    }
    this.started = true;
    this.open();
  }

  get connected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /** Subscribes to one message type. Returns the unsubscribe function. */
  on<T extends ServerType>(type: T, handler: Handler<T>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as Handler<ServerType>);
    return () => set.delete(handler as Handler<ServerType>);
  }

  /** Called with true on every (re)connect and false on every disconnect. */
  onStatus(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  send<T extends keyof ClientMessages>(type: T, payload: ClientMessages[T]) {
    if (this.connected) {
      this.socket?.send(JSON.stringify({ type, payload }));
    }
  }

  private open() {
    let socket: WebSocket;
    try {
      socket = new WebSocket(socketUrl());
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.reconnectDelay = RECONNECT_MIN_MS;
      this.pingTimer = window.setInterval(() => this.send('PING', {}), PING_INTERVAL_MS);
      this.notifyStatus(true);
    });

    socket.addEventListener('message', (event) => {
      let message: { type?: ServerType; payload?: unknown };
      try {
        message = JSON.parse(String(event.data)) as typeof message;
      } catch {
        return;
      }
      if (message.type) {
        this.handlers.get(message.type)?.forEach((handler) => handler(message.payload as never));
      }
    });

    socket.addEventListener('close', () => {
      window.clearInterval(this.pingTimer);
      if (this.socket === socket) {
        this.socket = null;
        this.notifyStatus(false);
        this.scheduleReconnect();
      }
    });
  }

  private scheduleReconnect() {
    window.clearTimeout(this.reconnectTimer);
    // Jitter keeps every open tab from reconnecting in the same instant after a deploy.
    const delay = this.reconnectDelay * (0.75 + Math.random() * 0.5);
    this.reconnectTimer = window.setTimeout(() => this.open(), delay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, RECONNECT_MAX_MS);
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((listener) => listener(connected));
  }
}

/** The one connection every component shares. */
export const liveClient = new LiveClient();

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store', signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

export function fetchCanvas(signal?: AbortSignal) {
  return getJson<CanvasBoard>('/api/live/canvas', signal);
}

export function fetchDeploys(signal?: AbortSignal) {
  return getJson<DeployEvent[]>('/api/live/deploys', signal);
}
