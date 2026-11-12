import { onMounted, onUnmounted } from 'vue';

/**
 * Calls `task` on mount and then every `intervalMs` while the component is mounted.
 * Ticks are skipped while the tab is hidden; with `refreshOnVisible` the task also runs
 * as soon as the tab becomes visible again.
 */
export function usePolling(task: () => void, intervalMs: number, { refreshOnVisible = false } = {}) {
  let timerId: number | undefined;

  function runIfVisible() {
    if (document.visibilityState === 'visible') {
      task();
    }
  }

  onMounted(() => {
    task();
    timerId = window.setInterval(runIfVisible, intervalMs);
    if (refreshOnVisible) {
      document.addEventListener('visibilitychange', runIfVisible);
    }
  });

  onUnmounted(() => {
    window.clearInterval(timerId);
    document.removeEventListener('visibilitychange', runIfVisible);
  });
}
