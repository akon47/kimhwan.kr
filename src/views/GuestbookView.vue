<template>
  <div class="container guestbook">
    <PageHeader
      eyebrow="Live"
      title="Pixel Guestbook"
      description="방문자 모두가 함께 그리는 방명록입니다. 색을 고르고 칸을 누르면 지금 보고 있는 모든 사람의 화면에 바로 찍힙니다."
    />

    <div class="meta tabular">
      <span class="meta__item"><StatusDot :state="live.connected ? 'up' : 'unknown'"/> {{ connectionLabel }}</span>
      <span v-if="board" class="meta__item">지금까지 {{ total.toLocaleString() }}개의 점</span>
      <span v-if="live.connected" class="meta__item">이 페이지에 {{ viewers }}명</span>
    </div>

    <div class="card board" :class="{ 'board--locked': !canPaint }">
      <div ref="stage" class="board__stage" :style="stageStyle" @pointermove="onHover" @pointerleave="hover = null" @click="paint">
        <canvas ref="canvas" class="board__canvas" :width="board?.width ?? 1" :height="board?.height ?? 1"/>
        <span v-if="hover && canPaint" class="board__cell" :style="cellStyle"/>
        <p v-if="!board" class="board__message">{{ loadError ? '방명록을 불러오지 못했습니다.' : '불러오는 중…' }}</p>
      </div>
    </div>

    <div v-if="board" class="tools">
      <div class="palette" role="radiogroup" aria-label="색 고르기">
        <button
          v-for="(color, index) in board.palette"
          :key="color"
          type="button"
          class="swatch"
          :class="{ 'swatch--active': index === selected }"
          :style="{ background: color }"
          role="radio"
          :aria-checked="index === selected"
          :aria-label="`색 ${index + 1}`"
          @click="selected = index"
        />
      </div>
      <p class="hint" aria-live="polite">
        <template v-if="!live.connected">실시간 서버에 연결되면 그릴 수 있습니다.</template>
        <template v-else-if="waitMs > 0">{{ (waitMs / 1000).toFixed(1) }}초 뒤에 다시 찍을 수 있어요.</template>
        <template v-else>한 번에 한 칸, {{ (board.cooldownMs / 1000).toFixed(0) }}초마다 찍을 수 있어요.</template>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, useTemplateRef } from 'vue';
import PageHeader from '@/components/layout/PageHeader.vue';
import StatusDot from '@/components/ui/StatusDot.vue';
import { useLive, useLiveMessage } from '@/composables/useLive';
import { fetchCanvas } from '@/services/liveClient';
import type { CanvasBoard } from '@/types/live';

const DEFAULT_COLOR_INDEX = 12;

const { live, client } = useLive();

const board = shallowRef<CanvasBoard | null>(null);
const loadError = ref(false);
const total = ref(0);
const selected = ref(DEFAULT_COLOR_INDEX);

const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
const stage = useTemplateRef<HTMLElement>('stage');
const controller = new AbortController();

const viewers = computed(() => live.pages['/guestbook'] ?? 1);
const connectionLabel = computed(() => (live.connected ? '실시간 연결됨' : '연결 중…'));
const stageStyle = computed(() => (board.value ? { aspectRatio: `${board.value.width} / ${board.value.height}` } : undefined));

/* ----- drawing: the canvas has one device pixel per board pixel and is scaled up by CSS ----- */
function drawPixel(x: number, y: number, colorIndex: number) {
  const context = canvas.value?.getContext('2d');
  const color = board.value?.palette[colorIndex];
  if (context && color) {
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
  }
}

function drawBoard(data: CanvasBoard) {
  const bytes = atob(data.pixels);
  for (let i = 0; i < bytes.length; i++) {
    drawPixel(i % data.width, Math.floor(i / data.width), bytes.charCodeAt(i));
  }
}

async function load() {
  try {
    const data = await fetchCanvas(controller.signal);
    board.value = data;
    total.value = data.total;
    loadError.value = false;
    // The canvas gets its size from `board`; draw once Vue has applied it.
    requestAnimationFrame(() => drawBoard(data));
  } catch {
    loadError.value = !controller.signal.aborted;
  }
}

useLiveMessage('PIXEL', (pixel) => {
  drawPixel(pixel.x, pixel.y, pixel.color);
  total.value = pixel.total;
});

// Pixels painted while this tab was disconnected never arrived: reload the board on every reconnect.
const stopStatus = client.onStatus((connected) => {
  if (connected) {
    void load();
  }
});

/* ----- painting ----- */
const hover = ref<{ x: number; y: number } | null>(null);
const cooldownUntil = ref(0);
const now = ref(Date.now());
let clock: number | undefined;

const waitMs = computed(() => Math.max(0, cooldownUntil.value - now.value));
const canPaint = computed(() => live.connected && board.value !== null && waitMs.value === 0);

function cellAt(event: MouseEvent): { x: number; y: number } | null {
  const data = board.value;
  const rect = stage.value?.getBoundingClientRect();
  if (!data || !rect || rect.width === 0) {
    return null;
  }
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * data.width);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * data.height);
  return x >= 0 && x < data.width && y >= 0 && y < data.height ? { x, y } : null;
}

function onHover(event: PointerEvent) {
  hover.value = event.pointerType === 'mouse' ? cellAt(event) : null;
}

const cellStyle = computed(() => {
  const data = board.value;
  const cell = hover.value;
  if (!data || !cell) {
    return undefined;
  }
  return {
    left: `${(cell.x / data.width) * 100}%`,
    top: `${(cell.y / data.height) * 100}%`,
    width: `${100 / data.width}%`,
    height: `${100 / data.height}%`,
    background: data.palette[selected.value],
  };
});

function startCooldown(ms: number) {
  now.value = Date.now();
  cooldownUntil.value = now.value + ms;
}

function paint(event: MouseEvent) {
  const cell = cellAt(event);
  if (!cell || !canPaint.value || !board.value) {
    return;
  }
  client.send('PIXEL', { ...cell, color: selected.value });
  // The server echoes the pixel to everyone, me included; the cooldown starts right away.
  startCooldown(board.value.cooldownMs);
}

// Someone on the same network (same IP) painted just before me, or my clock ran ahead of the server's.
useLiveMessage('PIXEL_REJECTED', ({ retryAfterMs }) => startCooldown(retryAfterMs));

onMounted(() => {
  void load();
  clock = window.setInterval(() => (now.value = Date.now()), 100);
});

onUnmounted(() => {
  controller.abort();
  stopStatus();
  window.clearInterval(clock);
});
</script>

<style scoped>
.guestbook {
  display: grid;
  gap: var(--space-4);
}

.guestbook > :first-child {
  margin-bottom: var(--space-2);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.meta__item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.board {
  padding: var(--space-2);
  overflow: hidden;
}

.board__stage {
  position: relative;
  min-height: 8rem;
  border-radius: var(--radius-sm);
  /* never-painted pixels are white in both themes: it is a sheet of paper */
  background: #fff;
  cursor: crosshair;
  touch-action: manipulation;
}

.board--locked .board__stage {
  cursor: progress;
}

.board__canvas {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  image-rendering: pixelated;
}

.board__cell {
  position: absolute;
  outline: 1px solid rgb(0 0 0 / 0.55);
  box-shadow: 0 0 0 2px rgb(255 255 255 / 0.9);
  pointer-events: none;
}

.board__message {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #71717a;
  font-size: var(--text-sm);
}

.tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3) var(--space-6);
}

.palette {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.swatch {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-sm);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.18);
  transition: transform var(--duration-fast);
}

.swatch:hover {
  transform: scale(1.1);
}

.swatch--active {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.hint {
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}
</style>
