<template>
  <component
    :is="interactive ? 'button' : 'div'"
    class="tile"
    :class="{ 'tile--warn': warn, 'tile--interactive': interactive, 'tile--compact': compact }"
    :type="interactive ? 'button' : undefined"
  >
    <span class="tile__label">{{ label }}</span>
    <span class="tile__value tabular" :class="{ 'tile__value--text': !unit }">
      {{ value }}<span v-if="unit" class="tile__unit">{{ unit }}</span>
    </span>
    <MeterBar v-if="meter !== undefined" :value="meter" :invert="meterInvert" :label="label"/>
    <SparkLine v-if="series && series.length > 1" :values="series" :max="100" :width="200" :height="26" class="tile__spark"/>
    <span v-if="$slots.default" class="tile__note"><slot/></span>
  </component>
</template>

<script setup lang="ts">
import MeterBar from '@/components/ui/MeterBar.vue';
import SparkLine from '@/components/ui/SparkLine.vue';

/** One number with its label: optional usage meter, 24 h sparkline and a note (default slot). */
withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    unit?: string;
    /** 0–100: draws a usage bar under the value. */
    meter?: number;
    /** For the meter, low values are the bad ones. */
    meterInvert?: boolean;
    /** Percentages over time, drawn as a sparkline. */
    series?: (number | null)[];
    /** Highlights the tile (something needs attention). */
    warn?: boolean;
    /** Renders as a button. */
    interactive?: boolean;
    /** Smaller type, for use inside dialogs. */
    compact?: boolean;
  }>(),
  { unit: '', meter: undefined, meterInvert: false, series: undefined, warn: false, interactive: false, compact: false },
);
</script>

<style scoped>
.tile {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  text-align: left;
}

.tile--warn {
  border-color: var(--color-warning);
}

.tile--interactive {
  cursor: pointer;
  transition:
    border-color var(--duration-fast),
    box-shadow var(--duration-fast);
}

.tile--interactive:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.tile__label {
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
}

.tile__value {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.tile__value--text {
  font-size: var(--text-xl);
}

.tile__unit {
  margin-left: 2px;
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  letter-spacing: 0;
}

.tile__spark {
  width: 100%;
}

.tile__note {
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
}

.tile--compact {
  gap: var(--space-1);
  padding: var(--space-3);
  border-radius: var(--radius-md);
}

.tile--compact .tile__value {
  font-size: var(--text-lg);
}

.tile--compact .tile__value--text {
  font-size: var(--text-sm);
  letter-spacing: 0;
}
</style>
