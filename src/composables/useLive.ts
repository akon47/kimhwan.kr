import { onUnmounted, reactive, readonly } from 'vue';
import type { Router } from 'vue-router';
import { liveClient } from '@/services/liveClient';
import type { ServerMessages } from '@/types/live';
import { tabIdentity } from '@/utils/identity';

interface LiveState {
  connected: boolean;
  /** My id on the server; other visitors' cursors carry theirs. */
  selfId: string | null;
  online: number;
  pages: Readonly<Record<string, number>>;
}

// Module-level: one connection and one state for the whole app.
const state = reactive<LiveState>({ connected: false, selfId: null, online: 0, pages: {} });
let currentPath = '/';

/**
 * Connects to the realtime backend and keeps the server informed of the page this tab is on.
 * Call once, from the root component.
 */
export function startLive(router: Router) {
  liveClient.onStatus((connected) => {
    state.connected = connected;
    if (connected) {
      liveClient.send('HELLO', { ...tabIdentity(), path: currentPath });
    } else {
      state.online = 0;
      state.pages = {};
    }
  });
  liveClient.on('WELCOME', (welcome) => {
    state.selfId = welcome.id;
    state.online = welcome.presence.online;
    state.pages = welcome.presence.pages;
  });
  liveClient.on('PRESENCE', (presence) => {
    state.online = presence.online;
    state.pages = presence.pages;
  });

  router.afterEach((to) => {
    currentPath = to.path;
    liveClient.send('NAVIGATE', { path: currentPath });
  });
  void router.isReady().then(() => {
    currentPath = router.currentRoute.value.path;
    liveClient.start();
  });
}

/** Shared realtime state (read-only) and the client for sending. */
export function useLive() {
  return { live: readonly(state), client: liveClient, identity: tabIdentity() };
}

/** Subscribes to a server message for as long as the calling component is mounted. */
export function useLiveMessage<T extends keyof ServerMessages>(type: T, handler: (payload: ServerMessages[T]) => void) {
  onUnmounted(liveClient.on(type, handler));
}
