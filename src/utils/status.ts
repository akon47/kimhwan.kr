import type { CheckResult, Health, StatusSnapshot, TrafficSummary } from '@/types/status';

export type Tone = 'success' | 'warning' | 'danger';

const HEALTH_LABELS: Record<Health, string> = {
  up: '정상',
  degraded: '일부 문제',
  down: '중단',
};

export function healthLabel(health: Health): string {
  return HEALTH_LABELS[health];
}

/** Colour for a usage level. With `invert`, low values are the bad ones (battery charge). */
export function usageTone(percent: number, invert = false): Tone {
  const level = invert ? 100 - percent : percent;
  if (level >= 90) {
    return 'danger';
  }
  return level >= 75 ? 'warning' : 'success';
}

/** One-line tooltip for a health check. */
export function describeCheck(check: CheckResult): string {
  const parts = [check.name, check.ok ? '정상' : '실패'];
  if (check.status) {
    parts.push(`HTTP ${check.status}`);
  }
  if (check.error) {
    parts.push(check.error);
  }
  parts.push(`${check.ms} ms`);
  return parts.join(' · ');
}

export interface TrafficRate {
  /** Requests per minute. */
  readonly rpm: number;
  /** Response bytes per second. */
  readonly bpsOut: number;
  /** Request bytes per second. */
  readonly bpsIn: number;
}

const NO_TRAFFIC: TrafficRate = { rpm: 0, bpsOut: 0, bpsIn: 0 };

/** Average traffic of one service over the snapshot's window. */
export function serviceTraffic(traffic: TrafficSummary | null | undefined, serviceId: string): TrafficRate {
  if (!traffic) {
    return NO_TRAFFIC;
  }
  const seconds = traffic.windowMinutes * 60;
  return {
    rpm: (traffic.byService[serviceId] ?? 0) / traffic.windowMinutes,
    bpsOut: (traffic.bytesByService?.[serviceId] ?? 0) / seconds,
    bpsIn: (traffic.reqBytesByService?.[serviceId] ?? 0) / seconds,
  };
}

export function runningGuestCount(snapshot: StatusSnapshot): number {
  return snapshot.guests.filter((guest) => guest.status === 'running').length;
}
