import { onMounted, onUnmounted, ref } from 'vue';
import type { StatusSnapshot } from '@/types/status';

const STATUS_URL = '/api/status';
const REFRESH_MS = 20_000;

/** Polls the status API while the component is mounted; pauses when the tab is hidden. */
export function useStatus() {
  const data = ref<StatusSnapshot | null>(null);
  const error = ref<string | null>(null);
  const loading = ref(true);
  const lastUpdated = ref<Date | null>(null);
  let timerId: number | undefined;
  let inFlight = false;

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
    timerId = window.setInterval(tick, REFRESH_MS);
    document.addEventListener('visibilitychange', onVisibility);
  });

  onUnmounted(() => {
    if (timerId !== undefined) {
      window.clearInterval(timerId);
    }
    document.removeEventListener('visibilitychange', onVisibility);
  });

  return { data, error, loading, lastUpdated, refresh };
}
