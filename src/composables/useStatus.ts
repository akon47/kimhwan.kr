import { onMounted, onUnmounted, ref } from 'vue';
import type { HistoryResponse, StatusSnapshot, UptimeResponse } from '@/types/status';

const STATUS_URL = '/api/status';
const HISTORY_URL = '/api/status/history?hours=24';
const UPTIME_URL = '/api/status/uptime';
const REFRESH_MS = 20_000;
const SLOW_REFRESH_MS = 5 * 60_000;

/** Polls the status API while the component is mounted; pauses when the tab is hidden. */
export function useStatus() {
  const data = ref<StatusSnapshot | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(true);
  const lastUpdated = ref<Date | null>(null);
  const history = ref<HistoryResponse | null>(null);
  const uptime = ref<UptimeResponse | null>(null);
  let timerId: number | undefined;
  let slowTimerId: number | undefined;
  let inFlight = false;

  async function refreshSlow() {
    const get = async <T,>(url: string): Promise<T | null> => {
      try {
        const res = await fetch(url, { headers: { accept: 'application/json' } });
        return res.ok ? ((await res.json()) as T) : null;
      } catch {
        return null;
      }
    };
    const [h, u] = await Promise.all([get<HistoryResponse>(HISTORY_URL), get<UptimeResponse>(UPTIME_URL)]);
    if (h) {
      history.value = h;
    }
    if (u) {
      uptime.value = u;
    }
  }

  async function refresh() {
    if (inFlight) {
      return;
    }
    inFlight = true;
    try {
      const res = await fetch(STATUS_URL, { headers: { accept: 'application/json' }, cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      data.value = (await res.json()) as StatusSnapshot;
      lastUpdated.value = new Date();
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
      inFlight = false;
    }
  }

  function tick() {
    if (document.visibilityState === 'visible') {
      void refresh();
    }
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') {
      void refresh();
    }
  }

  onMounted(() => {
    void refresh();
    void refreshSlow();
    timerId = window.setInterval(tick, REFRESH_MS);
    slowTimerId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshSlow();
      }
    }, SLOW_REFRESH_MS);
    document.addEventListener('visibilitychange', onVisibility);
  });

  onUnmounted(() => {
    if (timerId !== undefined) {
      window.clearInterval(timerId);
    }
    if (slowTimerId !== undefined) {
      window.clearInterval(slowTimerId);
    }
    document.removeEventListener('visibilitychange', onVisibility);
  });

  return { data, error, loading, lastUpdated, history, uptime, refresh };
}
