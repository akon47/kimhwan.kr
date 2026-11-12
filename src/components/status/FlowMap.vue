<template>
  <div ref="wrap" class="flow-map">
    <div class="toggles">
      <label v-for="overlay in overlays" :key="overlay.kind" class="toggle">
        <input v-model="show[overlay.kind]" type="checkbox"/>
        <i class="swatch" :class="`swatch--${overlay.kind}`"/>
        {{ text.overlays[overlay.kind] }}
      </label>
      <span class="hint">{{ text.hint(windowMinutes) }}</span>
    </div>

    <svg
      ref="svg"
      :viewBox="`0 0 ${layout.w} ${layout.h}`"
      class="flow-svg"
      :class="{ 'flow-svg--narrow': narrow }"
      role="img"
      :aria-label="text.label"
      @mouseleave="hoverId = null"
    >
      <defs>
        <marker
          :id="arrowId"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="9"
          markerHeight="9"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/>
        </marker>
      </defs>

      <rect :x="layout.home.x" :y="layout.home.y" :width="layout.home.w" :height="layout.home.h" rx="18" class="home-box"/>
      <text :x="layout.home.x + 20" :y="layout.home.y + 32" class="home-label">{{ text.home }}</text>
      <text v-for="label in layout.labels" :key="label.column" :x="label.x" :y="label.y" class="col-label">{{ text.columns[label.column] }}</text>

      <g class="edges" :class="{ dimmed: hoverId !== null }">
        <path
          v-for="edge in visibleEdges"
          :key="edge.id"
          :d="edge.d"
          :class="edgeClass(edge)"
          :style="{ strokeWidth: edge.width, animationDuration: edge.duration }"
          :marker-end="edge.trunk ? undefined : arrowUrl"
        >
          <title>{{ edge.title }}</title>
        </path>
      </g>

      <g class="edge-labels" :class="{ dimmed: hoverId !== null }">
        <text v-for="edge in labelled(visibleEdges)" :key="edge.id" :x="edge.lx" :y="edge.ly" :text-anchor="edge.anchor" class="edge-label">
          <tspan v-for="(line, i) in edge.lines" :key="i" :x="edge.lx" :dy="i === 0 ? 0 : LABEL_LINE_HEIGHT">{{ line }}</tspan>
        </text>
      </g>

      <!-- one dot per live request burst, travelling visitor → gateway → service (under the node boxes) -->
      <g v-if="show.traffic" class="pulses" aria-hidden="true">
        <circle v-for="dot in dots" :key="dot.key" r="4" class="pulse-dot">
          <animateMotion :path="dot.path" :dur="`${DOT_TRAVEL_SECONDS}s`" :begin="`${dot.begin}s`" fill="freeze"/>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.88;1" :dur="`${DOT_TRAVEL_SECONDS}s`" :begin="`${dot.begin}s`" fill="freeze"/>
        </circle>
      </g>

      <g
        v-for="node in nodes"
        :key="node.id"
        class="node"
        :class="[`node--${node.health}`, { 'node--linked': !!node.url || !!node.select }]"
        @click="pick(node)"
        @mouseenter="hoverId = node.id"
        @mouseleave="hoverId = null"
      >
        <component :is="opensLink(node) ? 'a' : 'g'" v-bind="opensLink(node) ? { href: node.url, target: '_blank', rel: 'noopener' } : {}">
          <title>{{ node.title }}</title>
          <rect :x="node.x" :y="node.y" :width="node.w" :height="node.h" rx="12" class="node-box"/>
          <circle v-if="node.health !== 'none'" :cx="node.x + 16" :cy="node.y + node.h / 2" r="5" class="node-dot"/>
          <text :x="textX(node)" :y="node.y + node.h / 2 + (node.sub ? -3 : 6)" class="node-title">{{ node.icon }} {{ node.label }}</text>
          <text v-if="node.sub" :x="textX(node)" :y="node.y + node.h / 2 + 15" class="node-sub">{{ node.sub }}</text>
        </component>
      </g>

      <!-- edges of the hovered node, redrawn above the nodes with a halo so their whole path is visible -->
      <g v-if="hoverId !== null" class="edges-top">
        <template v-for="edge in highlightedEdges" :key="edge.id">
          <path :d="edge.d" class="edge-halo" :style="{ strokeWidth: edge.width + 6 }"/>
          <path
            :d="edge.d"
            :class="[edgeClass(edge), 'edge--highlight']"
            :style="{ strokeWidth: edge.width + 0.8, animationDuration: edge.duration }"
            :marker-end="edge.trunk ? undefined : arrowUrl"
          />
        </template>
        <text
          v-for="edge in labelled(highlightedEdges)"
          :key="edge.id"
          :x="edge.lx"
          :y="edge.ly"
          :text-anchor="edge.anchor"
          class="edge-label edge-label--highlight"
        >
          <tspan v-for="(line, i) in edge.lines" :key="i" :x="edge.lx" :dy="i === 0 ? 0 : LABEL_LINE_HEIGHT">{{ line }}</tspan>
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, useId, useTemplateRef } from 'vue';
import { useTrafficPulse } from '@/composables/useTrafficPulse';
import { useI18n } from '@/i18n';
import type { StatusSnapshot } from '@/types/status';
import { buildEdges, buildNodes, edgeTouchesNode, pulsePath, type EdgeKind, type FlowEdge, type FlowNode } from './flow/graph';
import { NARROW_LAYOUT, WIDE_LAYOUT } from './flow/layout';

const NARROW_BELOW_PX = 720;
const LABEL_LINE_HEIGHT = 13;

const props = defineProps<{ data: StatusSnapshot }>();
const emit = defineEmits<{ select: [id: string] }>();

const { t } = useI18n();
const text = computed(() => t.value.status.flow);

/* ----- overlays ----- */
const show = reactive<Record<EdgeKind, boolean>>({ traffic: true, power: true, deploy: true, logs: true });

const ALL_OVERLAYS: { kind: EdgeKind; wideOnly?: boolean }[] = [
  { kind: 'traffic' },
  { kind: 'power' },
  { kind: 'deploy', wideOnly: true },
  { kind: 'logs', wideOnly: true },
];

const overlays = computed(() => ALL_OVERLAYS.filter((overlay) => !overlay.wideOnly || !narrow.value));

/* ----- responsive layout: the phone layout is a different drawing, not a scaled one ----- */
const wrap = ref<HTMLElement | null>(null);
const narrow = ref(false);
let observer: ResizeObserver | undefined;

onMounted(() => {
  const element = wrap.value;
  if (!element) {
    return;
  }
  const update = () => {
    narrow.value = element.clientWidth < NARROW_BELOW_PX;
  };
  update();
  observer = new ResizeObserver(update);
  observer.observe(element);
});

onUnmounted(() => observer?.disconnect());

const layout = computed(() => (narrow.value ? NARROW_LAYOUT : WIDE_LAYOUT));

/* ----- graph ----- */
const windowMinutes = computed(() => props.data.traffic?.windowMinutes ?? 5);

const nodes = computed(() => buildNodes(props.data, layout.value, { narrow: narrow.value, showDeploy: show.deploy }));
const edges = computed(() => buildEdges(props.data, nodes.value, layout.value, narrow.value));
const visibleEdges = computed(() => edges.value.filter((edge) => show[edge.kind]));

/* ----- live pulses: requests seen in the last few seconds, drawn as dots running along their route ----- */
const DOT_TRAVEL_SECONDS = 1.8;
const MAX_DOTS_PER_SERVICE = 5;
const MAX_DOTS = 80;

interface Dot {
  key: number;
  path: string;
  /** Start time on the SVG's own clock, in seconds. */
  begin: number;
}

const svg = useTemplateRef<SVGSVGElement>('svg');
const dots = ref<Dot[]>([]);
const dotTimers = new Set<number>();
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
let nextDotKey = 0;

useTrafficPulse((pulse) => {
  const clock = svg.value?.getCurrentTime();
  if (clock === undefined || reducedMotion || !show.traffic) {
    return;
  }
  for (const [serviceId, count] of Object.entries(pulse.byService)) {
    const path = pulsePath(serviceId, nodes.value, edges.value, layout.value, narrow.value);
    if (!path) {
      continue;
    }
    for (let i = 0; i < Math.min(count, MAX_DOTS_PER_SERVICE) && dots.value.length < MAX_DOTS; i++) {
      // Spread a burst over the interval it was counted in, so the dots do not leave as one clump.
      const delay = Math.random() * pulse.seconds;
      const dot: Dot = { key: nextDotKey++, path, begin: clock + delay };
      dots.value.push(dot);
      const timer = window.setTimeout(
        () => {
          dotTimers.delete(timer);
          dots.value = dots.value.filter((other) => other.key !== dot.key);
        },
        (delay + DOT_TRAVEL_SECONDS) * 1000 + 200,
      );
      dotTimers.add(timer);
    }
  }
});

onUnmounted(() => dotTimers.forEach((timer) => window.clearTimeout(timer)));

/* ----- hover & selection ----- */
const hoverId = ref<string | null>(null);

const highlightedEdges = computed(() => {
  const id = hoverId.value;
  return id === null ? [] : visibleEdges.value.filter((edge) => edgeTouchesNode(edge.id, id));
});

function pick(node: FlowNode) {
  if (node.select) {
    hoverId.value = null;
    emit('select', node.select);
  }
}

/** Nodes without a detail panel open their URL instead. */
function opensLink(node: FlowNode): boolean {
  return !!node.url && !node.select;
}

/* ----- rendering helpers ----- */
// Marker ids are document-global, so make this instance's unique.
const arrowId = `flow-arrow-${useId()}`;
const arrowUrl = `url(#${arrowId})`;

function edgeClass(edge: FlowEdge) {
  return ['edge', `edge--${edge.kind}`, { 'edge--active': edge.active, 'edge--dead': edge.dead, 'edge--trunk': edge.trunk }];
}

function labelled(list: FlowEdge[]) {
  return list.filter((edge) => edge.label).map((edge) => ({ ...edge, lines: edge.label?.split('\n') ?? [] }));
}

function textX(node: FlowNode): number {
  return node.x + (node.health !== 'none' ? 30 : 14);
}
</script>

<style scoped>
.flow-map {
  width: 100%;
}

/* ----- overlay toggles ----- */
.toggles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-4);
  margin-bottom: var(--space-3);
  font-size: var(--text-xs);
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  user-select: none;
}

.toggle input {
  margin: 0;
  accent-color: var(--color-accent);
}

.hint {
  margin-left: auto;
  color: var(--color-text-subtle);
}

.swatch {
  display: inline-block;
  width: 20px;
  height: 0;
  border-top: 3px solid;
}

.swatch--traffic { border-color: var(--color-accent); }
.swatch--power { border-color: var(--color-success); }
.swatch--deploy { border-color: var(--color-flow-deploy); border-top-style: dashed; }
.swatch--logs { border-color: var(--color-flow-logs); border-top-style: dotted; }

/* ----- canvas ----- */
.flow-svg {
  display: block;
  width: 100%;
  height: auto;
  font-family: var(--font-sans);
  user-select: none;
}

.home-box {
  fill: var(--color-surface-muted);
  fill-opacity: 0.45;
  stroke: var(--color-border-strong);
  stroke-width: 1.5;
  stroke-dasharray: 7 6;
}

.home-label {
  fill: var(--color-text);
  font-size: 15px;
  font-weight: 700;
  opacity: 0.8;
}

.col-label {
  fill: var(--color-text-subtle);
  font-size: 12px;
  letter-spacing: 0.1em;
}

/* ----- edges ----- */
.edge {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.32;
  transition: opacity 0.3s;
}

.edge--traffic { stroke: var(--color-accent); }
.edge--power { stroke: var(--color-success); }
.edge--deploy { stroke: var(--color-flow-deploy); stroke-dasharray: 4 7; }
.edge--logs { stroke: var(--color-flow-logs); stroke-dasharray: 2 7; }

.edge--trunk {
  opacity: 0.45;
  stroke-linecap: butt;
}

/* Moving dashes. Each keyframe shifts by a whole number of dash periods so the loop is seamless. */
.edge--active {
  opacity: 0.9;
  stroke-dasharray: 8 10;
  animation: flow-18 linear infinite;
}

.edge--deploy.edge--active { stroke-dasharray: 4 9; animation-name: flow-13; }
.edge--logs.edge--active { stroke-dasharray: 2 8; animation-name: flow-10; }
.edge--power.edge--active { stroke-dasharray: 11 9; animation-name: flow-20; }

.edge--dead {
  stroke: var(--color-danger);
  stroke-dasharray: 3 6;
  opacity: 0.6;
  animation: none;
}

.edge:hover { opacity: 1; }

@keyframes flow-18 { to { stroke-dashoffset: -36; } }
@keyframes flow-13 { to { stroke-dashoffset: -39; } }
@keyframes flow-10 { to { stroke-dashoffset: -40; } }
@keyframes flow-20 { to { stroke-dashoffset: -40; } }

.pulses {
  pointer-events: none;
}

/* invisible until its <animate> starts */
.pulse-dot {
  fill: var(--color-accent);
  opacity: 0;
  filter: drop-shadow(0 0 3px var(--color-accent));
}

/* hover: everything else fades, the hovered node's edges are redrawn on top */
.edges.dimmed .edge { opacity: 0.1; }
.edge-labels.dimmed .edge-label { opacity: 0.2; }

.edges-top {
  pointer-events: none;
}

.edge-halo {
  fill: none;
  stroke: var(--color-surface);
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.9;
}

.edge--highlight,
.edge--highlight.edge--trunk {
  opacity: 1;
}

.edge-label {
  fill: var(--color-text);
  font-size: 12px;
  font-weight: 500;
  opacity: 0.85;
  paint-order: stroke;
  stroke: var(--color-surface);
  stroke-width: 4px;
  stroke-linejoin: round;
  pointer-events: none;
}

.edge-label--highlight {
  font-weight: 700;
  opacity: 1;
}

/* ----- nodes ----- */
.node text {
  pointer-events: none;
}

.node--linked {
  cursor: pointer;
}

.node-box {
  fill: var(--color-surface);
  stroke: var(--color-border-strong);
  stroke-width: 1.5;
  transition:
    stroke 0.2s,
    filter 0.2s;
}

.node--up .node-box { stroke: color-mix(in srgb, var(--color-success) 70%, transparent); }
.node--degraded .node-box { stroke: color-mix(in srgb, var(--color-warning) 85%, transparent); }
.node--down .node-box { stroke: var(--color-danger); stroke-width: 2; }

.node--linked:hover .node-box {
  stroke: var(--color-accent);
  filter: drop-shadow(0 3px 6px rgb(0 0 0 / 0.15));
}

.node-dot { fill: var(--color-neutral); }
.node--up .node-dot { fill: var(--color-success); }
.node--degraded .node-dot { fill: var(--color-warning); }
.node--down .node-dot { fill: var(--color-danger); }

.node-title {
  fill: var(--color-text);
  font-size: 15px;
  font-weight: 700;
}

.node-sub {
  fill: var(--color-text-muted);
  font-size: 12px;
}

.flow-svg--narrow .node-title { font-size: 16px; }
.flow-svg--narrow .node-sub { font-size: 12.5px; }
.flow-svg--narrow .edge-label { font-size: 12.5px; }

@media (prefers-reduced-motion: reduce) {
  .edge--active { animation: none; }
}
</style>
