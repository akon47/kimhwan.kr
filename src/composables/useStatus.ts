import { ref, shallowRef } from 'vue';
import { usePolling } from '@/composables/usePolling';
import { fetchHistory, fetchStatus, fetchUptime } from '@/services/statusApi';
import type { HistoryResponse, StatusSnapshot, UptimeResponse } from '@/types/status';

export const STATUS_REFRESH_MS = 20_000;
const TRENDS_REFRESH_MS = 5 * 60_000;

/**
 * Live dashboard state: the current snapshot (polled every 20 s) plus the slower 24 h history
 * and uptime series. Polling pauses while the tab is hidden.
 */
export function useStatus() {
  const data = shallowRef<StatusSnapshot | null>(null);
  const history = shallowRef<HistoryResponse | null>(null);
  const uptime = shallowRef<UptimeResponse | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(true);
  const lastUpdated = ref<Date | null>(null);
  let inFlight = false;

  async function refresh() {
    if (inFlight) {
      return;
    }
    inFlight = true;
    try {
      data.value = await fetchStatus();
      lastUpdated.value = new Date();
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
      inFlight = false;
    }
  }

  /** Trend series are optional extras: on failure the last good values stay. */
  async function refreshTrends() {
    const [historyResult, uptimeResult] = await Promise.allSettled([fetchHistory(24), fetchUptime()]);
    if (historyResult.status === 'fulfilled') {
      history.value = historyResult.value;
    }
    if (uptimeResult.status === 'fulfilled') {
      uptime.value = uptimeResult.value;
    }
  }

  usePolling(() => void refresh(), STATUS_REFRESH_MS, { refreshOnVisible: true });
  usePolling(() => void refreshTrends(), TRENDS_REFRESH_MS);

  return { data, error, loading, lastUpdated, history, uptime, refresh };
}
