<template>
  <div v-if="enabled" class="cursors" aria-hidden="true">
    <div
      v-for="cursor in cursors.values()"
      :key="cursor.id"
      class="cursor"
      :class="{ 'cursor--idle': cursor.idle }"
      :style="{ transform: `translate(${cursor.x}px, ${cursor.y}px)`, '--cursor-color': cursor.color }"
    >
      <svg class="cursor__arrow" viewBox="0 0 16 16" width="16" height="16">
        <path d="M1 1 L1 13 L4.6 9.8 L7 15 L9.4 13.9 L7 8.8 L12 8.8 Z"/>
      </svg>
      <span class="cursor__label">{{ cursor.chat ?? cursor.name }}</span>
    </div>

    <!-- my own cursor chat: press "/" to type a line next to the pointer -->
    <form
      v-if="composing"
      class="composer"
      :style="{ transform: `translate(${own.x}px, ${own.y}px)`, '--cursor-color': identity.color }"
      @submit.prevent="sendChat"
    >
      <input
        ref="composerInput"
        v-model="draft"
        class="composer__input"
        :maxlength="MAX_CHAT_LENGTH"
        :placeholder="t.live.chatPlaceholder"
        :aria-label="t.live.chatLabel"
        @keydown.esc.stop="composing = false"
        @blur="composing = false"
      >
    </form>
    <div
      v-else-if="ownChat"
      class="cursor cursor--own"
      :style="{ transform: `translate(${own.x}px, ${own.y}px)`, '--cursor-color': identity.color }"
    >
      <span class="cursor__label">{{ ownChat }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLive, useLiveMessage } from '@/composables/useLive';
import { useI18n } from '@/i18n';

/**
 * Other visitors' pointers on the page I am looking at, and mine sent to them (multiplayer cursors).
 * Positions are relative to the horizontal centre of the page, where the content column sits, so they
 * line up across window widths. Mouse only: on touch screens there is no pointer to share.
 */
const SEND_INTERVAL_MS = 50;
const IDLE_AFTER_MS = 8_000;
const REMOVE_AFTER_MS = 30_000;
const CHAT_VISIBLE_MS = 6_000;
const MAX_CHAT_LENGTH = 60;

interface ShownCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  chat: string | null;
  chatUntil: number;
  seenAt: number;
  idle: boolean;
}

const { client, identity } = useLive();
const { t } = useI18n();
const route = useRoute();

const enabled = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;

/* ----- other visitors ----- */
const cursors = reactive(new Map<string, ShownCursor>());

function centerX(): number {
  return document.documentElement.clientWidth / 2;
}

useLiveMessage('CURSORS', ({ cursors: updates }) => {
  const now = Date.now();
  for (const update of updates) {
    if (update.x === null || update.y === null) {
      cursors.delete(update.id);
      continue;
    }
    const previous = cursors.get(update.id);
    cursors.set(update.id, {
      id: update.id,
      name: update.name,
      color: update.color,
      x: centerX() + update.x,
      y: update.y,
      chat: update.chat ?? (previous && previous.chatUntil > now ? previous.chat : null),
      chatUntil: update.chat ? now + CHAT_VISIBLE_MS : (previous?.chatUntil ?? 0),
      seenAt: now,
      idle: false,
    });
  }
});

// A page shows only its own visitors; whoever is left on the old page is no longer relevant.
watch(
  () => route.path,
  () => cursors.clear(),
);

/* ----- my pointer ----- */
const own = reactive({ x: 0, y: 0, clientX: 0, clientY: 0, visible: false });
let lastSentAt = 0;
let trailingTimer: number | undefined;

function sendPosition() {
  lastSentAt = Date.now();
  client.send('CURSOR', { x: Math.round(own.x - centerX()), y: Math.round(own.y) });
}

function track(clientX: number, clientY: number) {
  own.clientX = clientX;
  own.clientY = clientY;
  own.x = clientX + window.scrollX;
  own.y = clientY + window.scrollY;
  own.visible = true;
  // Throttle, but always deliver the final position once the pointer rests.
  window.clearTimeout(trailingTimer);
  const wait = SEND_INTERVAL_MS - (Date.now() - lastSentAt);
  if (wait <= 0) {
    sendPosition();
  } else {
    trailingTimer = window.setTimeout(sendPosition, wait);
  }
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType === 'mouse') {
    track(event.clientX, event.clientY);
  }
}

/** Scrolling moves the page under a resting pointer. */
function onScroll() {
  if (own.visible) {
    track(own.clientX, own.clientY);
  }
}

function hideOwn() {
  if (own.visible) {
    own.visible = false;
    window.clearTimeout(trailingTimer);
    client.send('CURSOR', {});
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    hideOwn();
  }
}

/* ----- cursor chat ----- */
const composing = ref(false);
const draft = ref('');
const ownChat = ref<string | null>(null);
const composerInput = useTemplateRef<HTMLInputElement>('composerInput');
let ownChatTimer: number | undefined;

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target) || !own.visible) {
    return;
  }
  event.preventDefault();
  draft.value = '';
  composing.value = true;
  void nextTick(() => composerInput.value?.focus());
}

function sendChat() {
  const text = draft.value.trim();
  composing.value = false;
  if (!text) {
    return;
  }
  client.send('CHAT', { text });
  ownChat.value = text;
  window.clearTimeout(ownChatTimer);
  ownChatTimer = window.setTimeout(() => (ownChat.value = null), CHAT_VISIBLE_MS);
}

/* ----- housekeeping: fade resting cursors, drop stale ones, expire chat lines ----- */
let sweepTimer: number | undefined;

function sweep() {
  const now = Date.now();
  for (const cursor of cursors.values()) {
    if (now - cursor.seenAt > REMOVE_AFTER_MS) {
      cursors.delete(cursor.id);
      continue;
    }
    cursor.idle = now - cursor.seenAt > IDLE_AFTER_MS;
    if (cursor.chat && cursor.chatUntil <= now) {
      cursor.chat = null;
    }
  }
}

onMounted(() => {
  if (!enabled) {
    return;
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', onKeydown);
  document.documentElement.addEventListener('pointerleave', hideOwn);
  document.addEventListener('visibilitychange', onVisibilityChange);
  sweepTimer = window.setInterval(sweep, 1000);
});

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('keydown', onKeydown);
  document.documentElement.removeEventListener('pointerleave', hideOwn);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.clearInterval(sweepTimer);
  window.clearTimeout(trailingTimer);
  window.clearTimeout(ownChatTimer);
});
</script>

<style scoped>
/* A layer over the whole page (not the viewport): cursors scroll with the content they point at. */
.cursors {
  position: absolute;
  inset: 0;
  z-index: var(--z-cursors);
  overflow: hidden;
  pointer-events: none;
}

.cursor,
.composer {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: flex-start;
}

.cursor {
  transition:
    transform 90ms linear,
    opacity var(--duration-base);
}

.cursor--idle {
  opacity: 0.35;
}

.cursor__arrow {
  flex-shrink: 0;
  fill: var(--cursor-color);
  stroke: #fff;
  stroke-width: 1;
  stroke-linejoin: round;
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.3));
}

.cursor__label,
.composer__input {
  max-width: 16rem;
  margin: 12px 0 0 2px;
  padding: 2px var(--space-2);
  border-radius: 4px var(--radius-md) var(--radius-md) var(--radius-md);
  background: var(--cursor-color);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  line-height: 1.5;
  box-shadow: var(--shadow-sm);
}

.cursor__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* My own bubble sits where the remote label would, next to the real pointer. */
.cursor--own .cursor__label,
.composer__input {
  margin: 14px 0 0 14px;
}

.composer {
  pointer-events: auto;
}

.composer__input {
  width: 12rem;
  border: 0;
  outline: 2px solid color-mix(in srgb, var(--cursor-color) 40%, transparent);
}

.composer__input::placeholder {
  color: rgb(255 255 255 / 0.7);
}
</style>
