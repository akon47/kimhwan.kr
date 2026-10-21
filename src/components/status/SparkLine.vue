<template>
  <svg :viewBox="`0 0 ${width} ${height}`" :width="width" :height="height" class="sparkline" preserveAspectRatio="none" aria-hidden="true">
    <path v-if="area" :d="area" class="area" :style="{ fill: color }"/>
    <path v-if="line" :d="line" class="line" :style="{ stroke: color }"/>
    <circle v-if="last" :cx="last.x" :cy="last.y" r="1.8" :style="{ fill: color }"/>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    values: (number | null)[];
    color?: string;
    width?: number;
    height?: number;
    /** Fixed upper bound (e.g. 100 for percentages); otherwise the series max. */
    max?: number;
  }>(),
  { color: 'var(--link-accent-color)', width: 120, height: 28 },
);

const points = computed(() => {
  const vals = props.values;
  const n = vals.length;
  if (n === 0) {
    return [];
  }
  const present = vals.filter((v): v is number => v !== null);
  if (present.length === 0) {
    return [];
  }
  const max = props.max ?? Math.max(...present, 1);
  const min = props.max !== undefined ? 0 : Math.min(...present, 0);
  const span = max - min || 1;
  const pad = 2;
  return vals.map((v, i) => {
    if (v === null) {
      return null;
    }
    const x = n === 1 ? props.width / 2 : (i / (n - 1)) * (props.width - 2 * pad) + pad;
    const y = props.height - pad - ((v - min) / span) * (props.height - 2 * pad);
    return { x, y };
  });
});

const line = computed(() => {
  let d = '';
  let pen = false;
  for (const p of points.value) {
    if (!p) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
    pen = true;
  }
  return d.trim();
});

const area = computed(() => {
  const pts = points.value.filter((p): p is { x: number; y: number } => p !== null);
  if (pts.length < 2) {
    return '';
  }
  const first = pts[0];
  const lastP = pts[pts.length - 1];
  if (!first || !lastP) {
    return '';
  }
  const bottom = props.height - 2;
  return `M${first.x.toFixed(1)} ${bottom} ` + pts.map((p) => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ` L${lastP.x.toFixed(1)} ${bottom} Z`;
});

const last = computed(() => {
  const pts = points.value.filter((p): p is { x: number; y: number } => p !== null);
  return pts[pts.length - 1] ?? null;
});
</script>

<style scoped>
.sparkline {
  display: block;
  overflow: visible;
}

.line {
  fill: none;
  stroke-width: 1.5;
  stroke-linejoin: round;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.area {
  opacity: 0.12;
}
</style>
