<template>
  <article class="card card--interactive project">
    <header class="project__head">
      <span class="project__icon" aria-hidden="true">
        <AppIcon :name="kindIcon" :size="16"/>
      </span>
      <h3 class="project__title">{{ project.title }}</h3>
      <span class="project__kind">{{ projectKindLabels[project.kind] }}</span>
    </header>

    <p class="project__summary">{{ project.summary }}</p>

    <ul class="project__tags" aria-label="기술 스택">
      <li v-for="tag in project.tags" :key="tag" class="tag">{{ tag }}</li>
    </ul>

    <footer class="project__links">
      <a
        v-if="project.primaryLink"
        class="btn btn--sm btn--primary"
        :href="project.primaryLink.url"
        target="_blank"
        rel="noopener"
      >
        {{ project.primaryLink.label }}
        <AppIcon name="arrow-up-right" :size="14"/>
      </a>
      <a
        v-for="url in project.githubUrls"
        :key="url"
        class="btn btn--sm project__repo"
        :href="url"
        :title="url"
        target="_blank"
        rel="noopener"
      >
        <AppIcon name="github" :size="14"/>
        <span>{{ repoName(url) }}</span>
      </a>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { IconName } from '@/components/ui/icons';
import { projectKindLabels, type Project, type ProjectKind } from '@/data/projects';

const props = defineProps<{
  project: Project;
}>();

const KIND_ICONS: Record<ProjectKind, IconName> = {
  desktop: 'monitor',
  web: 'globe',
  library: 'package',
};

const kindIcon = computed(() => KIND_ICONS[props.project.kind]);

/** "https://github.com/akon47/NvChat" → "NvChat" */
function repoName(url: string): string {
  return url.replace(/\/$/, '').split('/').pop() ?? url;
}
</script>

<style scoped>
.project {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-5);
}

.project__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.project__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.project__title {
  flex: 1;
  min-width: 0;
  font-size: var(--text-md);
}

.project__kind {
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
}

.project__summary {
  flex: 1;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  word-break: normal;
}

.project__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.project__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-top: var(--space-1);
}

.project__repo {
  min-width: 0;
  color: var(--color-text-muted);
}

.project__repo span {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
