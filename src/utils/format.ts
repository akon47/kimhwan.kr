/** Display formatters shared by the dashboard. Durations are worded in the current language. */
import { messages } from '@/i18n';

const GIB = 1024 ** 3;
const MIB = 1024 ** 2;
const KIB = 1024;

export const EMPTY = '–';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Whole-number percentage of `used` in `total` (0 when the total is unknown). */
export function percentOf(used: number, total: number): number {
  return total > 0 ? Math.round((used / total) * 100) : 0;
}

/** Bytes as GiB: one decimal below 100 GB, none above. */
export function formatGb(bytes: number): string {
  return (bytes / GIB).toFixed(bytes >= 100 * GIB ? 0 : 1);
}

/** Seconds as the two largest units, e.g. "12d 3h", "3h 20m", "5m" ("12일 3시간", … in Korean). */
export function formatUptime(seconds: number): string {
  const time = messages.value.time;
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) {
    return time.daysHours(days, hours);
  }
  return hours > 0 ? time.hoursMinutes(hours, minutes) : time.minutes(minutes);
}

/** Seconds as an exact duration, e.g. "42s", "3m 5s", "2h 10m" ("42초", … in Korean). */
export function formatSeconds(seconds: number | null): string {
  if (seconds === null) {
    return EMPTY;
  }
  const time = messages.value.time;
  if (seconds < 60) {
    return time.seconds(seconds);
  }
  if (seconds < 3600) {
    return time.minutesSeconds(Math.floor(seconds / 60), seconds % 60);
  }
  return time.hoursMinutes(Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60));
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Local time as HH:MM:SS. */
export function formatClock(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/** ISO timestamp as local "M/D HH:MM". */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Requests per minute. */
export function formatRate(perMinute: number): string {
  return `${perMinute.toFixed(perMinute >= 10 ? 0 : 1)}/min`;
}

/**
 * Bytes per second. The compact form ("12K/s", and a bare "0" for nothing) is for the flow map,
 * where labels have to fit between nodes.
 */
export function formatBps(bytesPerSecond: number, { compact = false }: { compact?: boolean } = {}): string {
  if (compact && bytesPerSecond <= 0) {
    return '0';
  }
  const sep = compact ? '' : ' ';
  const suffix = compact ? '/s' : 'B/s';
  if (bytesPerSecond >= MIB) {
    return `${(bytesPerSecond / MIB).toFixed(1)}${sep}M${suffix}`;
  }
  if (bytesPerSecond >= KIB) {
    return `${(bytesPerSecond / KIB).toFixed(0)}${sep}K${suffix}`;
  }
  return `${bytesPerSecond.toFixed(0)}${sep}B/s`;
}

/** Availability percentage: "100%" once it rounds to 100, otherwise one decimal. */
export function formatAvailability(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return EMPTY;
  }
  return `${value.toFixed(value >= 99.95 ? 0 : 1)}%`;
}

/** A nullable number with fixed decimals, or a dash. */
export function formatNumber(value: number | null | undefined, digits = 0): string {
  return value === null || value === undefined ? EMPTY : value.toFixed(digits);
}
