<template>
  <ol v-if="deploys.length" class="feed">
    <li v-for="deploy in deploys" :key="`${deploy.repo}@${deploy.at}`" class="feed__item" :class="{ 'feed__item--new': isFresh(deploy) }">
      <span class="feed__icon" aria-hidden="true"><AppIcon name="package" :size="14"/></span>
      <a class="feed__repo" :href="registryUrl(deploy)" target="_blank" rel="noopener">{{ deploy.repo }}</a>
      <span v-if="deploy.tag" class="feed__tag mono">#{{ deploy.tag }}</span>
      <time class="feed__time" :datetime="deploy.at" :title="new Date(deploy.at).toLocaleString(locale)">
        {{ formatRelativeTime(deploy.at, now) }}
      </time>
    </li>
  </ol>
  <p v-else class="feed__empty">{{ failed ? t.live.deploysFailed : t.common.loading }}</p>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { useLiveMessage } from '@/composables/useLive';
import { site } from '@/config/site';
import { useI18n } from '@/i18n';
import { fetchDeploys } from '@/services/liveClient';
import type { DeployEvent } from '@/types/live';
import { formatRelativeTime } from '@/utils/time';

/**
 * Recent deploys, newest first. A deploy here means "a new image reached Docker Hub": the step of the
 * pipeline (GitHub → Jenkins → Docker Hub → VM) that can be observed without touching the build server.
 */
const props = withDefaults(defineProps<{ limit?: number }>(), { limit: 8 });

const FRESH_MS = 10 * 60_000;

const { t, locale } = useI18n();

const deploys = ref<DeployEvent[]>([]);
const failed = ref(false);
const now = ref(Date.now());
const controller = new AbortController();
let clock: number | undefined;

onMounted(async () => {
  clock = window.setInterval(() => (now.value = Date.now()), 30_000);
  try {
    deploys.value = (await fetchDeploys(controller.signal)).slice(0, props.limit);
  } catch {
    failed.value = !controller.signal.aborted;
  }
});

onUnmounted(() => {
  controller.abort();
  window.clearInterval(clock);
});

useLiveMessage('DEPLOY', (deploy) => {
  now.value = Date.now();
  deploys.value = [deploy, ...deploys.value].slice(0, props.limit);
});

function isFresh(deploy: DeployEvent): boolean {
  return now.value - new Date(deploy.at).getTime() < FRESH_MS;
}

function registryUrl(deploy: DeployEvent): string {
  return `https://hub.docker.com/r/${site.githubUser}/${deploy.repo}/tags`;
}
</script>

<style scoped>
.feed {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17.5rem), 1fr));
  gap: var(--space-2);
}

.feed__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--text-sm);
}

.feed__item--new {
  border-color: color-mix(in srgb, var(--color-flow-deploy) 55%, var(--color-border));
}

.feed__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-flow-deploy) 14%, transparent);
  color: var(--color-flow-deploy);
}

.feed__repo {
  min-width: 0;
  overflow: hidden;
  font-weight: var(--weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed__repo:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.feed__tag {
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
}

.feed__time {
  flex-shrink: 0;
  margin-left: auto;
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
}

.feed__empty {
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}
</style>
