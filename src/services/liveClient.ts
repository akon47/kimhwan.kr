import type { ClientMessages, DeployEvent, GuestbookEntry, GuestbookPage, ServerMessages } from '@/types/live';

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

const GUESTBOOK_URL = '/api/live/guestbook';

/** Guestbook entries, newest first. `before` is the id of the oldest entry already shown. */
export function fetchGuestbook({ before, limit }: { before?: number; limit?: number } = {}, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (before !== undefined) {
    params.set('before', String(before));
  }
  if (limit !== undefined) {
    params.set('limit', String(limit));
  }
  return getJson<GuestbookPage>(params.size ? `${GUESTBOOK_URL}?${params}` : GUESTBOOK_URL, signal);
}

/** Why a guestbook message was not saved. `retryAfterMs` is set for `cooldown`. */
export class GuestbookError extends Error {
  constructor(
    readonly reason: 'empty' | 'cooldown' | 'failed',
    readonly retryAfterMs = 0,
  ) {
    super(reason);
  }
}

/** Leaves a message. Everyone connected, me included, also receives it as a GUESTBOOK message. */
export async function postGuestbook(name: string, message: string): Promise<GuestbookEntry> {
  let response: Response;
  try {
    response = await fetch(GUESTBOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ name, message }),
    });
  } catch {
    throw new GuestbookError('failed');
  }
  if (response.ok) {
    return (await response.json()) as GuestbookEntry;
  }
  const body = (await response.json().catch(() => null)) as { error?: string; retryAfterMs?: number } | null;
  if (response.status === 429) {
    throw new GuestbookError('cooldown', body?.retryAfterMs ?? 0);
  }
  throw new GuestbookError(body?.error === 'EMPTY' ? 'empty' : 'failed');
}

/** Moderation: deletes an entry with the key from the owner's notification mail. Resolves to false when refused. */
export async function deleteGuestbookEntry(id: number, key: string): Promise<boolean> {
  try {
    const response = await fetch(`${GUESTBOOK_URL}/${id}`, { method: 'DELETE', headers: { 'x-admin-token': key } });
    return response.ok;
  } catch {
    return false;
  }
}

export function fetchDeploys(signal?: AbortSignal) {
  return getJson<DeployEvent[]>('/api/live/deploys', signal);
}
