<template>
  <span
    class="meter"
    :class="`meter--${tone}`"
    role="meter"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(clamped)"
    :aria-label="label"
  >
    <span class="meter__fill" :style="{ width: `${clamped}%` }"/>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { clamp } from '@/utils/format';
import { usageTone } from '@/utils/status';

const props = withDefaults(
  defineProps<{
    /** 0–100. */
    value: number;
    /** Low values are the bad ones (e.g. battery charge). */
    invert?: boolean;
    label?: string;
  }>(),
  { invert: false, label: undefined },
);

const clamped = computed(() => clamp(props.value, 0, 100));
const tone = computed(() => usageTone(clamped.value, props.invert));
</script>

<style scoped>
.meter {
  display: block;
  height: 6px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--color-surface-muted);
}

.meter__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--meter-color);
  transition: width 0.6s var(--ease-out);
}

.meter--success {
  --meter-color: var(--color-success);
}

.meter--warning {
  --meter-color: var(--color-warning);
}

.meter--danger {
  --meter-color: var(--color-danger);
}
</style>
