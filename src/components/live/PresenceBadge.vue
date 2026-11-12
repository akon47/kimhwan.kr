<template>
  <Transition name="fade">
    <RouterLink
      v-if="live.connected && live.online > 0"
      to="/guestbook"
      class="presence tabular"
      :title="t.live.presenceTitle(live.online)"
      :aria-label="t.live.presenceLabel(live.online)"
    >
      <span class="presence__dot" aria-hidden="true"/>
      <span class="presence__count">{{ live.online }}</span>
    </RouterLink>
  </Transition>
</template>

<script setup lang="ts">
import { useLive } from '@/composables/useLive';
import { useI18n } from '@/i18n';

/** How many tabs are on the site right now. Hidden while the realtime backend is unreachable. */
const { live } = useLive();
const { t } = useI18n();
</script>

<style scoped>
/*
 * The dot and the digits have to share one centre line. Every size here is a whole, even number of pixels
 * (26px inside the border, 8px dot, 12px line), so neither of them lands on a half pixel and gets rounded
 * a different way than the other.
 */
.presence {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding-inline: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: var(--weight-semibold);
  line-height: 1;
  transition: border-color var(--duration-fast);
}

.presence:hover {
  border-color: var(--color-border-strong);
}

.presence__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  animation: breathe 2.4s ease-in-out infinite;
}

/* Digits have no descenders: centre their own height (baseline to cap height), not the whole line box. */
.presence__count {
  display: block;
  text-box: trim-both cap alphabetic;
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
