import type { HistoryResponse, StatusSnapshot, UptimeResponse } from '@/types/status';

/**
 * Client for the home server status API (akon47/homelab-status), served from the same origin
 * by the gateway. In development Vite proxies `/api` to the live site (see vite.config.ts).
 */
const BASE = '/api/status';

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { accept: 'application/json', ...init?.headers } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

/** Current snapshot. Never cached: the dashboard polls it. */
export function fetchStatus(signal?: AbortSignal): Promise<StatusSnapshot> {
  return getJson<StatusSnapshot>(BASE, { cache: 'no-store', signal });
}

export function fetchHistory(hours = 24, signal?: AbortSignal): Promise<HistoryResponse> {
  return getJson<HistoryResponse>(`${BASE}/history?hours=${hours}`, { signal });
}

export function fetchUptime(signal?: AbortSignal): Promise<UptimeResponse> {
  return getJson<UptimeResponse>(`${BASE}/uptime`, { signal });
}
