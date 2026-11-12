<template>
  <div class="container guestbook">
    <PageHeader :eyebrow="text.eyebrow" :title="text.title" :description="text.description"/>

    <div class="meta tabular">
      <span class="meta__item">
        <StatusDot :state="live.connected ? 'up' : 'unknown'"/>
        {{ live.connected ? text.connected : text.connecting }}
      </span>
      <span v-if="loaded" class="meta__item">{{ text.total(total) }}</span>
      <span v-if="live.connected" class="meta__item">{{ text.viewers(viewers) }}</span>
    </div>

    <!-- moderation: opened from the link in the owner's notification mail (?delete=<id>&key=<signature>) -->
    <section v-if="moderation" class="card moderation" aria-live="polite">
      <template v-if="moderation.state === 'confirm' && moderation.entry">
        <p class="moderation__prompt">{{ text.deletePrompt }}</p>
        <blockquote class="moderation__quote">
          <strong>{{ moderation.entry.name || text.anonymous }}</strong>
          <span class="entry__message">{{ moderation.entry.message }}</span>
        </blockquote>
        <div class="moderation__actions">
          <button type="button" class="btn btn--sm btn--danger" :disabled="moderation.busy" @click="confirmDelete">{{ text.delete }}</button>
          <button type="button" class="btn btn--sm" :disabled="moderation.busy" @click="moderation = null">{{ text.cancel }}</button>
        </div>
      </template>
      <template v-else>
        <p class="moderation__prompt">{{ moderationMessage }}</p>
        <div class="moderation__actions">
          <button type="button" class="btn btn--sm" @click="moderation = null">{{ t.common.close }}</button>
        </div>
      </template>
    </section>

    <form class="card form" :aria-label="text.formLabel" @submit.prevent="submit">
      <label class="sr-only" for="guestbook-name">{{ text.name }}</label>
      <input
        id="guestbook-name"
        v-model="name"
        class="field field--name"
        type="text"
        autocomplete="nickname"
        :maxlength="limits.name"
        :placeholder="text.namePlaceholder"
      >
      <label class="sr-only" for="guestbook-message">{{ text.message }}</label>
      <textarea
        id="guestbook-message"
        v-model="message"
        class="field field--message"
        rows="3"
        :maxlength="limits.message"
        :placeholder="text.messagePlaceholder"
        @keydown.enter="onEnter"
      />
      <div class="form__foot">
        <p class="form__note" :class="{ 'form__note--error': noteIsError }" aria-live="polite">{{ note }}</p>
        <span class="form__count tabular" :class="{ 'form__count--full': message.length >= limits.message }">
          {{ message.length }} / {{ limits.message }}
        </span>
        <button type="submit" class="btn btn--primary" :disabled="!canSubmit">
          {{ submitting ? text.submitting : text.submit }}
        </button>
      </div>
    </form>

    <TransitionGroup v-if="entries.length" tag="ol" name="entry" class="entries">
      <li v-for="entry in entries" :key="entry.id" class="card entry">
        <span class="entry__avatar" :style="{ '--avatar-color': avatarColor(entry.name) }" aria-hidden="true">
          <template v-if="entry.name">{{ initial(entry.name) }}</template>
          <AppIcon v-else name="user" :size="16"/>
        </span>
        <div class="entry__body">
          <p class="entry__head">
            <strong class="entry__name">{{ entry.name || text.anonymous }}</strong>
            <time class="entry__time" :datetime="entry.at" :title="new Date(entry.at).toLocaleString(locale)">
              {{ formatRelativeTime(entry.at, listNow) }}
            </time>
          </p>
          <p class="entry__message">{{ entry.message }}</p>
        </div>
      </li>
    </TransitionGroup>
    <p v-else class="state">
      <template v-if="loadError">
        {{ text.loadFailed }}
        <button type="button" class="btn btn--sm" @click="load">{{ text.retry }}</button>
      </template>
      <template v-else>{{ loaded ? text.empty : t.common.loading }}</template>
    </p>

    <button v-if="hasMore" type="button" class="btn more" :disabled="loadingMore" @click="loadMore">{{ text.more }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageHeader from '@/components/layout/PageHeader.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import StatusDot from '@/components/ui/StatusDot.vue';
import { useLive, useLiveMessage } from '@/composables/useLive';
import { useI18n } from '@/i18n';
import { deleteGuestbookEntry, fetchGuestbook, GuestbookError, postGuestbook } from '@/services/liveClient';
import type { GuestbookEntry } from '@/types/live';
import { formatRelativeTime } from '@/utils/time';

/**
 * The guestbook: anyone can leave a short message, no sign-in. Entries are loaded over HTTP and new ones
 * arrive over the shared WebSocket, so the page still works (without live updates) when that is down.
 */
const NAME_STORAGE_KEY = 'guestbook-name';
const AVATAR_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'];

const { t, locale } = useI18n();
const text = computed(() => t.value.guestbook);
const { live, client } = useLive();
const route = useRoute();
const router = useRouter();
const controller = new AbortController();

const viewers = computed(() => live.pages['/guestbook'] ?? 1);

/* ----- entries, newest first ----- */
const entries = ref<GuestbookEntry[]>([]);
const total = ref(0);
const hasMore = ref(false);
const loaded = ref(false);
const loadError = ref(false);
const loadingMore = ref(false);
/** Limits enforced by the server; replaced by what it reports. */
const limits = reactive({ name: 20, message: 500 });

function addEntry(entry: GuestbookEntry) {
  if (!entries.value.some((other) => other.id === entry.id)) {
    entries.value = [entry, ...entries.value].sort((a, b) => b.id - a.id);
  }
}

function removeEntry(id: number) {
  entries.value = entries.value.filter((entry) => entry.id !== id);
}

/** Loads the newest page. Older pages already on screen stay below it. */
async function load() {
  try {
    const page = await fetchGuestbook({}, controller.signal);
    const oldestNew = page.entries.at(-1)?.id ?? 0;
    const olderShown = entries.value.filter((entry) => entry.id < oldestNew);
    entries.value = [...page.entries, ...olderShown];
    total.value = page.total;
    hasMore.value = olderShown.length ? hasMore.value : page.hasMore;
    limits.name = page.maxNameLength;
    limits.message = page.maxMessageLength;
    loaded.value = true;
    loadError.value = false;
  } catch {
    loadError.value = !controller.signal.aborted && !loaded.value;
  }
}

async function loadMore() {
  const oldest = entries.value.at(-1);
  if (!oldest || loadingMore.value) {
    return;
  }
  loadingMore.value = true;
  try {
    const page = await fetchGuestbook({ before: oldest.id }, controller.signal);
    entries.value = [...entries.value, ...page.entries.filter((entry) => entry.id < oldest.id)];
    total.value = page.total;
    hasMore.value = page.hasMore;
  } catch {
    // keep the button: the visitor can try again
  } finally {
    loadingMore.value = false;
  }
}

useLiveMessage('GUESTBOOK', (event) => {
  addEntry(event.entry);
  total.value = event.total;
});

useLiveMessage('GUESTBOOK_DELETED', (event) => {
  removeEntry(event.id);
  total.value = event.total;
});

// Entries posted while this tab was disconnected never arrived: reload after every reconnect.
let wasDisconnected = false;
const stopStatus = client.onStatus((connected) => {
  if (!connected) {
    wasDisconnected = true;
  } else if (wasDisconnected) {
    wasDisconnected = false;
    void load();
  }
});

/* ----- writing ----- */
const name = ref(readStoredName());
const message = ref('');
const submitting = ref(false);
const notice = ref<'posted' | 'empty' | 'failed' | 'cooldown' | null>(null);
const cooldownUntil = ref(0);
/** Ticks every second (cooldown countdown); the list reads the slower `listNow`. */
const now = ref(Date.now());
const listNow = ref(Date.now());
let clock: number | undefined;

const waitSeconds = computed(() => Math.max(0, Math.ceil((cooldownUntil.value - now.value) / 1000)));
const canSubmit = computed(() => !submitting.value && message.value.trim() !== '' && waitSeconds.value === 0);

const note = computed(() => {
  switch (notice.value) {
    case 'posted':
      return text.value.posted;
    case 'empty':
      return text.value.errorEmpty;
    case 'failed':
      return text.value.errorFailed;
    case 'cooldown':
      return waitSeconds.value > 0 ? text.value.errorCooldown(waitSeconds.value) : text.value.shortcut;
    default:
      return text.value.shortcut;
  }
});
const noteIsError = computed(() => notice.value === 'empty' || notice.value === 'failed' || (notice.value === 'cooldown' && waitSeconds.value > 0));

// Typing again clears the result of the previous attempt (the cooldown notice stays until it is over).
watch(message, () => {
  if (notice.value !== 'cooldown') {
    notice.value = null;
  }
});

function readStoredName(): string {
  try {
    return localStorage.getItem(NAME_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function storeName(value: string) {
  try {
    localStorage.setItem(NAME_STORAGE_KEY, value);
  } catch {
    // storage blocked: the name is simply not remembered
  }
}

async function submit() {
  if (!canSubmit.value) {
    return;
  }
  submitting.value = true;
  try {
    const entry = await postGuestbook(name.value.trim(), message.value);
    addEntry(entry);
    total.value = Math.max(total.value, entries.value.length);
    storeName(name.value.trim());
    message.value = '';
    // after the watcher on `message` has run
    queueMicrotask(() => (notice.value = 'posted'));
  } catch (error) {
    if (error instanceof GuestbookError && error.reason === 'cooldown') {
      now.value = Date.now();
      cooldownUntil.value = now.value + error.retryAfterMs;
      notice.value = 'cooldown';
    } else {
      notice.value = error instanceof GuestbookError && error.reason === 'empty' ? 'empty' : 'failed';
    }
  } finally {
    submitting.value = false;
  }
}

/** Ctrl+Enter (⌘+Enter) posts; a plain Enter is a line break. */
function onEnter(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && !event.isComposing) {
    event.preventDefault();
    void submit();
  }
}

/* ----- avatars: a colour per name, so the same visitor looks the same in every entry ----- */
function avatarColor(entryName: string): string {
  if (!entryName) {
    return 'var(--color-neutral)';
  }
  let hash = 0;
  for (const char of entryName) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 9973;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] as string;
}

function initial(entryName: string): string {
  return (Array.from(entryName)[0] ?? '').toUpperCase();
}

/* ----- moderation ----- */
interface Moderation {
  id: number;
  key: string;
  state: 'confirm' | 'missing' | 'deleted' | 'failed';
  entry: GuestbookEntry | null;
  busy: boolean;
}

const moderation = ref<Moderation | null>(null);

const moderationMessage = computed(() => {
  switch (moderation.value?.state) {
    case 'deleted':
      return text.value.deleted;
    case 'failed':
      return text.value.deleteFailed;
    default:
      return text.value.deleteMissing;
  }
});

/** Reads the delete link's parameters, then takes them out of the address bar. */
async function openModeration() {
  const id = Number(route.query.delete);
  const key = typeof route.query.key === 'string' ? route.query.key : '';
  if (!Number.isSafeInteger(id) || id <= 0 || !key) {
    return;
  }
  void router.replace({ query: {} });
  moderation.value = { id, key, state: 'missing', entry: null, busy: true };
  try {
    // "the newest entry older than id + 1" is the entry itself, if it still exists
    const page = await fetchGuestbook({ before: id + 1, limit: 1 }, controller.signal);
    const entry = page.entries.find((candidate) => candidate.id === id) ?? null;
    moderation.value = { id, key, state: entry ? 'confirm' : 'missing', entry, busy: false };
  } catch {
    moderation.value = { id, key, state: 'failed', entry: null, busy: false };
  }
}

async function confirmDelete() {
  const current = moderation.value;
  if (!current || current.busy) {
    return;
  }
  current.busy = true;
  const deleted = await deleteGuestbookEntry(current.id, current.key);
  if (deleted) {
    removeEntry(current.id);
    total.value = Math.max(0, total.value - 1);
  }
  moderation.value = { ...current, state: deleted ? 'deleted' : 'failed', entry: null, busy: false };
}

onMounted(() => {
  void load();
  void openModeration();
  clock = window.setInterval(() => {
    now.value = Date.now();
    if (now.value - listNow.value >= 30_000) {
      listNow.value = now.value;
    }
  }, 1000);
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
  max-width: calc(46rem + 2 * var(--layout-gutter));
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

/* ----- form ----- */
.form {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
}

.field {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: var(--text-base);
  transition: border-color var(--duration-fast);
}

.field::placeholder {
  color: var(--color-text-subtle);
}

.field:hover {
  border-color: var(--color-border-strong);
}

.field:focus-visible {
  outline-offset: 0;
  border-color: var(--color-accent);
  border-radius: var(--radius-md);
}

.field--name {
  max-width: 16rem;
}

.field--message {
  min-height: 5.5rem;
  resize: vertical;
  line-height: 1.6;
}

.form__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-4);
}

.form__note {
  flex: 1;
  min-width: 12rem;
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}

.form__note--error {
  color: var(--color-danger);
}

.form__count {
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
}

.form__count--full {
  color: var(--color-warning);
}

/* ----- entries ----- */
.entries {
  display: grid;
  gap: var(--space-3);
}

.entry {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
}

.entry__avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--avatar-color) 16%, transparent);
  color: var(--avatar-color);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  line-height: 1;
}

.entry__body {
  flex: 1;
  min-width: 0;
}

.entry__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--space-3);
}

.entry__name {
  overflow-wrap: anywhere;
}

.entry__time {
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
}

.entry__message {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  /* visitors write plain text: keep their line breaks, never let a long word widen the page */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.entry-enter-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.entry-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.entry-move {
  transition: transform var(--duration-base) var(--ease-out);
}

.state {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-10) var(--space-4);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  text-align: center;
}

.more {
  justify-self: center;
}

/* ----- moderation ----- */
.moderation {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border-color: var(--color-danger);
  background: var(--color-danger-soft);
}

.moderation__prompt {
  font-weight: var(--weight-semibold);
}

.moderation__quote {
  display: grid;
  gap: var(--space-1);
  padding-left: var(--space-3);
  border-left: 3px solid var(--color-danger);
  font-size: var(--text-sm);
}

.moderation__actions {
  display: flex;
  gap: var(--space-2);
}

.btn--danger {
  border-color: var(--color-danger);
  background: var(--color-danger);
  color: #fff;
}

.btn--danger:hover:not(:disabled) {
  border-color: var(--color-danger);
  background: var(--color-danger);
  opacity: 0.86;
}
</style>
