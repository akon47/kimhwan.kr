const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "방금 전", "5분 전", "3시간 전", "2일 전", then the date. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < MINUTE) {
    return '방금 전';
  }
  if (seconds < HOUR) {
    return `${Math.floor(seconds / MINUTE)}분 전`;
  }
  if (seconds < DAY) {
    return `${Math.floor(seconds / HOUR)}시간 전`;
  }
  if (seconds < 30 * DAY) {
    return `${Math.floor(seconds / DAY)}일 전`;
  }
  const date = new Date(then);
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}
