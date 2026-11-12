import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '@/i18n';
import {
  EMPTY,
  formatAvailability,
  formatBps,
  formatGb,
  formatRate,
  formatSeconds,
  formatUptime,
  percentOf,
} from './format';

const GIB = 1024 ** 3;

afterEach(() => setLocale('ko'));

describe('percentOf', () => {
  it('rounds to a whole percent', () => {
    expect(percentOf(1, 3)).toBe(33);
  });

  it('is 0 when the total is unknown', () => {
    expect(percentOf(5, 0)).toBe(0);
  });
});

describe('formatGb', () => {
  it('keeps one decimal below 100 GB and none above', () => {
    expect(formatGb(1.5 * GIB)).toBe('1.5');
    expect(formatGb(250 * GIB)).toBe('250');
  });
});

describe('formatUptime', () => {
  it('shows the two largest units', () => {
    setLocale('ko');
    expect(formatUptime(2 * 86_400 + 3 * 3600 + 59)).toBe('2일 3시간');
    expect(formatUptime(3 * 3600 + 20 * 60)).toBe('3시간 20분');
    expect(formatUptime(59)).toBe('0분');
  });

  it('follows the language', () => {
    setLocale('en');
    expect(formatUptime(2 * 86_400 + 3 * 3600 + 59)).toBe('2d 3h');
    expect(formatUptime(3 * 3600 + 20 * 60)).toBe('3h 20m');
    expect(formatUptime(59)).toBe('0m');
  });
});

describe('formatSeconds', () => {
  it('handles each range and null', () => {
    setLocale('ko');
    expect(formatSeconds(null)).toBe(EMPTY);
    expect(formatSeconds(42)).toBe('42초');
    expect(formatSeconds(185)).toBe('3분 5초');
    expect(formatSeconds(7800)).toBe('2시간 10분');
  });

  it('follows the language', () => {
    setLocale('en');
    expect(formatSeconds(42)).toBe('42s');
    expect(formatSeconds(185)).toBe('3m 5s');
    expect(formatSeconds(7800)).toBe('2h 10m');
  });
});

describe('formatRate', () => {
  it('drops the decimal from 10/min up', () => {
    expect(formatRate(2.34)).toBe('2.3/min');
    expect(formatRate(42.6)).toBe('43/min');
  });
});

describe('formatBps', () => {
  it('formats the long form', () => {
    expect(formatBps(0)).toBe('0 B/s');
    expect(formatBps(2048)).toBe('2 KB/s');
    expect(formatBps(1.5 * 1024 ** 2)).toBe('1.5 MB/s');
  });

  it('formats the compact form used on the flow map', () => {
    expect(formatBps(0, { compact: true })).toBe('0');
    expect(formatBps(512, { compact: true })).toBe('512B/s');
    expect(formatBps(2048, { compact: true })).toBe('2K/s');
    expect(formatBps(1.5 * 1024 ** 2, { compact: true })).toBe('1.5M/s');
  });
});

describe('formatAvailability', () => {
  it('shows 100% only when it rounds there', () => {
    expect(formatAvailability(100)).toBe('100%');
    expect(formatAvailability(99.96)).toBe('100%');
    expect(formatAvailability(99.9)).toBe('99.9%');
    expect(formatAvailability(null)).toBe(EMPTY);
  });
});
