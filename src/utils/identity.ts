/**
 * Who this tab is to other visitors: a random nickname and colour, kept for the life of the tab.
 * There are no accounts; nothing here identifies a person.
 */
export interface Identity {
  readonly name: string;
  readonly color: string;
}

const STORAGE_KEY = 'live-identity';

const ADJECTIVES = ['졸린', '신난', '배고픈', '용감한', '수줍은', '느긋한', '궁금한', '씩씩한', '조용한', '반짝이는'];
const ANIMALS = ['펭귄', '수달', '고양이', '여우', '너구리', '판다', '고래', '부엉이', '토끼', '다람쥐', '거북이', '코알라'];
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'];

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)] as T;
}

function isIdentity(value: unknown): value is Identity {
  const v = value as Identity | null;
  return typeof v?.name === 'string' && typeof v.color === 'string';
}

let cached: Identity | undefined;

export function tabIdentity(): Identity {
  if (cached) {
    return cached;
  }
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    if (isIdentity(stored)) {
      cached = stored;
      return cached;
    }
  } catch {
    // unreadable storage: make a new identity below
  }
  cached = { name: `${pick(ADJECTIVES)} ${pick(ANIMALS)}`, color: pick(COLORS) };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
  } catch {
    // storage blocked: the identity lasts until reload
  }
  return cached;
}
