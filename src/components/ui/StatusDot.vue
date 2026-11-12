<template>
  <span class="dot" :class="[`dot--${state}`, { 'dot--lg': large }]" aria-hidden="true"/>
</template>

<script setup lang="ts">
import type { Health } from '@/types/status';

withDefaults(
  defineProps<{
    /** `off` = stopped, `unknown` = not checked yet. */
    state: Health | 'off' | 'unknown';
    large?: boolean;
  }>(),
  { large: false },
);
</script>

<style scoped>
.dot {
  --dot-color: var(--color-neutral);

  display: inline-block;
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--dot-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--dot-color) 20%, transparent);
}

.dot--lg {
  width: 12px;
  height: 12px;
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--dot-color) 20%, transparent);
}

.dot--up {
  --dot-color: var(--color-success);
}

.dot--degraded {
  --dot-color: var(--color-warning);
}

.dot--down {
  --dot-color: var(--color-danger);

  animation: pulse 1.6s ease-in-out infinite;
}

.dot--off {
  box-shadow: none;
  opacity: 0.6;
}

@keyframes pulse {
  50% {
    box-shadow: 0 0 0 7px color-mix(in srgb, var(--dot-color) 6%, transparent);
  }
}
</style>
