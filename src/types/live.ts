// Wire format of the realtime backend (akon47/kimhwan-live), served as /api/live/**.

export interface Presence {
  /** Connected tabs in total. */
  readonly online: number;
  /** Connected tabs per page path. */
  readonly pages: Readonly<Record<string, number>>;
}

/** Another visitor's pointer on the page I am on. `x`/`y` are null once it is gone. */
export interface RemoteCursor {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  /** px from the horizontal centre of the page. */
  readonly x: number | null;
  /** px from the top of the page. */
  readonly y: number | null;
  /** A line of cursor chat, sent once. */
  readonly chat: string | null;
}

export interface PixelEvent {
  readonly x: number;
  readonly y: number;
  /** Palette index. */
  readonly color: number;
  /** Pixels painted since the board was created. */
  readonly total: number;
}

export interface CanvasBoard {
  readonly width: number;
  readonly height: number;
  readonly palette: readonly string[];
  readonly cooldownMs: number;
  readonly total: number;
  /** base64 of width × height palette indexes, row by row. */
  readonly pixels: string;
}

/** A new image of a service was pushed to Docker Hub, i.e. it is being deployed. */
export interface DeployEvent {
  /** Image name without the account, e.g. "hwanstory". */
  readonly repo: string;
  /** Pushed tag (the Jenkins build number), when known. */
  readonly tag: string | null;
  /** ISO time of the push. */
  readonly at: string;
}

/** Server → client messages by type. */
export interface ServerMessages {
  WELCOME: { readonly id: string; readonly presence: Presence; readonly pixelCooldownMs: number };
  PRESENCE: Presence;
  CURSORS: { readonly cursors: readonly RemoteCursor[] };
  PIXEL: PixelEvent;
  PIXEL_REJECTED: { readonly retryAfterMs: number };
  DEPLOY: DeployEvent;
  PONG: Record<string, never>;
}

/** Client → server messages by type. */
export interface ClientMessages {
  HELLO: { name: string; color: string; path: string };
  NAVIGATE: { path: string };
  /** Empty = my cursor is gone. */
  CURSOR: { x: number; y: number } | Record<string, never>;
  CHAT: { text: string };
  PIXEL: { x: number; y: number; color: number };
  PING: Record<string, never>;
}

/** One burst of requests seen by the status API's live stream (/api/status/stream). */
export interface TrafficPulse {
  readonly at: string;
  readonly seconds: number;
  readonly byService: Readonly<Record<string, number>>;
}
