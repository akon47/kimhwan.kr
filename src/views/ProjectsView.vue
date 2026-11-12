<template>
  <div class="container">
    <PageHeader
      eyebrow="Open source"
      title="Projects"
      description="Things I built in my own time and published on GitHub: Windows desktop apps, web services and a library."
    />

    <div class="filters" role="group" aria-label="프로젝트 종류">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="filter"
        :class="{ 'filter--active': filter === option.value }"
        :aria-pressed="filter === option.value"
        @click="filter = option.value"
      >
        {{ option.label }}
        <span class="filter__count">{{ option.count }}</span>
      </button>
    </div>

    <TransitionGroup tag="div" name="list" class="grid">
      <ProjectCard v-for="project in visibleProjects" :key="project.title" :project="project"/>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import PageHeader from '@/components/layout/PageHeader.vue';
import ProjectCard from '@/components/projects/ProjectCard.vue';
import { projectKindLabels, projects, type ProjectKind } from '@/data/projects';

type Filter = ProjectKind | 'all';

const filter = ref<Filter>('all');

const filterOptions = computed<{ value: Filter; label: string; count: number }[]>(() => [
  { value: 'all', label: 'All', count: projects.length },
  ...(Object.keys(projectKindLabels) as ProjectKind[]).map((kind) => ({
    value: kind,
    label: projectKindLabels[kind],
    count: projects.filter((project) => project.kind === kind).length,
  })),
]);

const visibleProjects = computed(() =>
  filter.value === 'all' ? projects : projects.filter((project) => project.kind === filter.value),
);
</script>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.filter {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 2rem;
  padding-inline: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition:
    background-color var(--duration-fast),
    border-color var(--duration-fast),
    color var(--duration-fast);
}

.filter:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text);
}

.filter--active,
.filter--active:hover {
  border-color: var(--color-text);
  background: var(--color-text);
  color: var(--color-bg);
}

.filter__count {
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  opacity: 0.65;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
  gap: var(--space-4);
}

.list-enter-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.list-enter-from {
  opacity: 0;
  transform: scale(0.97);
}

.list-leave-active {
  display: none;
}
</style>
