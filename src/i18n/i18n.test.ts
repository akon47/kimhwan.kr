import { afterEach, describe, expect, it } from 'vitest';
import { formatRelativeTime } from '@/utils/time';
import en from './en';
import { detectLocale, locale, messages, setLocale } from './index';
import ko from './ko';

afterEach(() => setLocale('ko'));

describe('detectLocale', () => {
  it('is Korean for a browser set to Korean, wherever it is', () => {
    expect(detectLocale(['ko-KR', 'en-US'], 'America/New_York')).toBe('ko');
    expect(detectLocale(['en-US', 'ko'], 'Europe/Berlin')).toBe('ko');
  });

  it('is Korean for a visitor on Korean time, whatever the browser language', () => {
    expect(detectLocale(['en-US'], 'Asia/Seoul')).toBe('ko');
  });

  it('is English for everyone else', () => {
    expect(detectLocale(['en-US'], 'America/New_York')).toBe('en');
    expect(detectLocale(['ja-JP', 'en'], 'Asia/Tokyo')).toBe('en');
    expect(detectLocale(['kok-IN'], 'Asia/Kolkata')).toBe('en');
    expect(detectLocale([], 'UTC')).toBe('en');
  });
});

describe('setLocale', () => {
  it('switches the texts everyone reads', () => {
    setLocale('en');
    expect(locale.value).toBe('en');
    expect(messages.value.nav.guestbook).toBe('Guestbook');
    setLocale('ko');
    expect(messages.value.nav.guestbook).toBe('방명록');
  });
});

/** Every key of `value`, e.g. "status.banner.up"; functions and arrays count as one entry. */
function keysOf(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    child !== null && typeof child === 'object' && !Array.isArray(child) ? keysOf(child, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe('catalogs', () => {
  it('have the same entries in both languages', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(ko).sort());
  });

  it('give every nickname word in both languages', () => {
    expect(en.live.adjectives).toHaveLength(ko.live.adjectives.length);
    expect(en.live.animals).toHaveLength(ko.live.animals.length);
  });
});

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-11-13T12:00:00Z');
  const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();

  it('words the age in Korean', () => {
    setLocale('ko');
    expect(formatRelativeTime(ago(20), now)).toBe('방금 전');
    expect(formatRelativeTime(ago(5 * 60), now)).toBe('5분 전');
    expect(formatRelativeTime(ago(3 * 3600), now)).toBe('3시간 전');
    expect(formatRelativeTime(ago(2 * 86_400), now)).toBe('2일 전');
  });

  it('words the age in English, with plurals', () => {
    setLocale('en');
    expect(formatRelativeTime(ago(20), now)).toBe('just now');
    expect(formatRelativeTime(ago(60), now)).toBe('1 minute ago');
    expect(formatRelativeTime(ago(5 * 60), now)).toBe('5 minutes ago');
    expect(formatRelativeTime(ago(3600), now)).toBe('1 hour ago');
    expect(formatRelativeTime(ago(2 * 86_400), now)).toBe('2 days ago');
  });
});
