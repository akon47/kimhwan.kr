// Shape of https://kimhwan.kr/api/status (served by akon47/homelab-status).
export type Health = 'up' | 'degraded' | 'down';

export interface CheckResult {
  readonly name: string;
  readonly ok: boolean;
  readonly ms: number;
  readonly status?: number;
  readonly error?: string;
}

export interface ServiceStatus {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly url?: string;
  readonly category: 'apps' | 'platform';
  readonly icon: string;
  readonly health: Health;
  readonly latencyMs: number | null;
  readonly checks: CheckResult[];
}

export interface HostStatus {
  readonly pveVersion: string;
  readonly kernel: string;
  readonly uptimeSec: number;
  readonly load1: number;
  readonly cpuPct: number;
  readonly cpuCount: number;
  readonly mem: { readonly used: number; readonly total: number };
  readonly swap: { readonly used: number; readonly total: number };
  readonly rootfs: { readonly used: number; readonly total: number };
  readonly ksmSharedBytes: number;
}

export interface StorageStatus {
  readonly name: string;
  readonly type: string;
  readonly used: number;
  readonly total: number;
}

export interface DiskStatus {
  readonly device: string;
  readonly model: string;
  readonly type: string;
  readonly sizeBytes: number;
  readonly health: string;
  readonly wearPct: number | null;
  readonly tempC: number | null;
}

export interface GuestStatus {
  readonly vmid: number;
  readonly name: string;
  readonly type: 'qemu' | 'lxc';
  readonly status: string;
  readonly cpuPct: number;
  readonly mem: number;
  readonly maxmem: number;
  readonly uptimeSec: number;
  readonly tags: string[];
}

export interface BackupStatus {
  readonly startedAt: string;
  readonly finishedAt: string | null;
  readonly durationSec: number | null;
  readonly status: string;
}

export interface UpsStatus {
  readonly model: string;
  readonly status: string;
  readonly onBattery: boolean;
  readonly chargePct: number | null;
  readonly loadPct: number | null;
  readonly runtimeMin: number | null;
  readonly lineVolts: number | null;
  readonly batteryVolts: number | null;
  readonly nominalPowerW: number | null;
  readonly transfers: number | null;
  readonly lastTransfer: string | null;
  readonly lastOnBattery: string | null;
}

export interface TrafficSummary {
  readonly windowMinutes: number;
  readonly total: number;
  readonly byVhost: Record<string, number>;
  readonly byService: Record<string, number>;
}

export interface StatusSnapshot {
  readonly generatedAt: string;
  readonly version: string;
  readonly overall: Health;
  readonly summary: { readonly up: number; readonly degraded: number; readonly down: number };
  readonly services: ServiceStatus[];
  readonly host: HostStatus | null;
  readonly storages: StorageStatus[];
  readonly disks: DiskStatus[];
  readonly guests: GuestStatus[];
  readonly backup: BackupStatus | null;
  readonly ups: UpsStatus | null;
  readonly traffic: TrafficSummary | null;
  readonly errors: string[];
}
