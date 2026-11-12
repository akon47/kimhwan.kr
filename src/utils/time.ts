import { messages } from '@/i18n';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "5 minutes ago", "3 hours ago", "2 days ago", then the date; worded in the current language. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const time = messages.value.time;
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < MINUTE) {
    return time.justNow;
  }
  if (seconds < HOUR) {
    return time.minutesAgo(Math.floor(seconds / MINUTE));
  }
  if (seconds < DAY) {
    return time.hoursAgo(Math.floor(seconds / HOUR));
  }
  if (seconds < 30 * DAY) {
    return time.daysAgo(Math.floor(seconds / DAY));
  }
  return time.date(new Date(then));
}
