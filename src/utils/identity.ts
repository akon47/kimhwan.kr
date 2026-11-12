import { messages } from '@/i18n';

/**
 * Who this tab is to other visitors: a random nickname and colour, kept for the life of the tab.
 * There are no accounts; nothing here identifies a person.
 */
export interface Identity {
  readonly name: string;
  readonly color: string;
}

/** What is stored: positions in the word lists rather than the words, so the nickname follows the language. */
interface StoredIdentity {
  readonly adjective: number;
  readonly animal: number;
  readonly color: string;
}

const STORAGE_KEY = 'live-identity';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'];

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

function isStoredIdentity(value: unknown): value is StoredIdentity {
  const v = value as StoredIdentity | null;
  return typeof v?.adjective === 'number' && typeof v.animal === 'number' && typeof v.color === 'string';
}

let cached: StoredIdentity | undefined;

function storedIdentity(): StoredIdentity {
  if (cached) {
    return cached;
  }
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    if (isStoredIdentity(stored)) {
      cached = stored;
      return cached;
    }
  } catch {
    // unreadable storage: make a new identity below
  }
  const { adjectives, animals } = messages.value.live;
  cached = {
    adjective: randomIndex(adjectives.length),
    animal: randomIndex(animals.length),
    color: COLORS[randomIndex(COLORS.length)] as string,
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // storage blocked: the identity lasts until reload
  }
  return cached;
}

/** This tab's nickname in the current language, and its colour. */
export function tabIdentity(): Identity {
  const stored = storedIdentity();
  const { adjectives, animals } = messages.value.live;
  const adjective = adjectives[stored.adjective % adjectives.length];
  const animal = animals[stored.animal % animals.length];
  return { name: `${adjective} ${animal}`, color: stored.color };
}
