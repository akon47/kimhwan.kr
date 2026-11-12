import { onMounted, onUnmounted } from 'vue';
import type { TrafficPulse } from '@/types/live';

const STREAM_URL = '/api/status/stream';

/**
 * Live traffic from the status API (server-sent events): `onPulse` is called every few seconds with the
 * services that just received requests. The stream is open only while the component is mounted and the tab
 * is visible, because the server queries the logs for as long as anyone is listening.
 * If the stream is unavailable nothing happens: the dashboard still has its 20 s snapshot.
 */
export function useTrafficPulse(onPulse: (pulse: TrafficPulse) => void) {
  let source: EventSource | null = null;

  function open() {
    if (source || typeof EventSource === 'undefined') {
      return;
    }
    source = new EventSource(STREAM_URL);
    source.addEventListener('pulse', (event) => {
      try {
        onPulse(JSON.parse((event as MessageEvent<string>).data) as TrafficPulse);
      } catch {
        // malformed event: ignore
      }
    });
  }

  function close() {
    source?.close();
    source = null;
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      open();
    } else {
      close();
    }
  }

  onMounted(() => {
    onVisibilityChange();
    document.addEventListener('visibilitychange', onVisibilityChange);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    close();
  });
}
