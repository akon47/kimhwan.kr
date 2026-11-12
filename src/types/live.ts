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

/** One message left in the guestbook. */
export interface GuestbookEntry {
  /** Increasing number: a newer entry always has a larger one. */
  readonly id: number;
  /** Empty when the visitor left the name blank. */
  readonly name: string;
  /** Plain text; may contain line breaks. */
  readonly message: string;
  /** ISO time. */
  readonly at: string;
}

/** One page of the guestbook (GET /api/live/guestbook), newest first. */
export interface GuestbookPage {
  readonly entries: readonly GuestbookEntry[];
  /** Entries in the whole guestbook. */
  readonly total: number;
  /** Older entries exist beyond this page. */
  readonly hasMore: boolean;
  readonly maxNameLength: number;
  readonly maxMessageLength: number;
  /** How long a visitor waits between two messages. */
  readonly cooldownMs: number;
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
  WELCOME: { readonly id: string; readonly presence: Presence };
  PRESENCE: Presence;
  CURSORS: { readonly cursors: readonly RemoteCursor[] };
  GUESTBOOK: { readonly entry: GuestbookEntry; readonly total: number };
  GUESTBOOK_DELETED: { readonly id: number; readonly total: number };
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
  PING: Record<string, never>;
}

/** One burst of requests seen by the status API's live stream (/api/status/stream). */
export interface TrafficPulse {
  readonly at: string;
  readonly seconds: number;
  readonly byService: Readonly<Record<string, number>>;
}
