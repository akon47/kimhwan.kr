<template>
  <Transition name="fade">
    <RouterLink
      v-if="live.connected && live.online > 0"
      to="/guestbook"
      class="presence tabular"
      :title="`지금 ${live.online}명이 보고 있어요`"
      :aria-label="`지금 ${live.online}명 접속 중, 방명록으로 이동`"
    >
      <span class="presence__dot" aria-hidden="true"/>
      {{ live.online }}
    </RouterLink>
  </Transition>
</template>

<script setup lang="ts">
import { useLive } from '@/composables/useLive';

/** How many tabs are on the site right now. Hidden while the realtime backend is unreachable. */
const { live } = useLive();
</script>

<style scoped>
.presence {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 1.75rem;
  padding-inline: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  transition: border-color var(--duration-fast);
}

.presence:hover {
  border-color: var(--color-border-strong);
}

.presence__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-success);
  animation: breathe 2.4s ease-in-out infinite;
}

@keyframes breathe {
  50% {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-success) 25%, transparent);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
