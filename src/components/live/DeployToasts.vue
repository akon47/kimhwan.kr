<template>
  <Teleport to="body">
    <TransitionGroup tag="div" name="toast" class="toasts" role="status" aria-live="polite">
      <RouterLink v-for="toast in toasts" :key="toast.key" to="/status" class="toast" @click="dismiss(toast.key)">
        <span class="toast__icon" aria-hidden="true"><AppIcon name="package" :size="16"/></span>
        <span class="toast__text">
          <strong>{{ toast.repo }}</strong>
          <template v-if="toast.tag"> #{{ toast.tag }}</template>
          <span class="toast__note">방금 새 버전이 배포됐어요</span>
        </span>
      </RouterLink>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { useLiveMessage } from '@/composables/useLive';

/** Announces a deploy to whoever is on the site when it happens, on any page. */
const VISIBLE_MS = 8_000;
const MAX_TOASTS = 3;

interface Toast {
  key: number;
  repo: string;
  tag: string | null;
}

const toasts = ref<Toast[]>([]);
const timers = new Set<number>();
let nextKey = 0;

function dismiss(key: number) {
  toasts.value = toasts.value.filter((toast) => toast.key !== key);
}

useLiveMessage('DEPLOY', (deploy) => {
  const key = nextKey++;
  toasts.value = [...toasts.value, { key, repo: deploy.repo, tag: deploy.tag }].slice(-MAX_TOASTS);
  const timer = window.setTimeout(() => {
    timers.delete(timer);
    dismiss(key);
  }, VISIBLE_MS);
  timers.add(timer);
});

onUnmounted(() => timers.forEach((timer) => window.clearTimeout(timer)));
</script>

<style scoped>
.toasts {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: var(--z-toast);
  display: grid;
  gap: var(--space-2);
  max-width: calc(100vw - 2 * var(--space-4));
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  font-size: var(--text-sm);
}

.toast__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-flow-deploy) 14%, transparent);
  color: var(--color-flow-deploy);
}

.toast__note {
  display: block;
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
