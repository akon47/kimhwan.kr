<template>
  <div class="projects-container">
    <ProjectOverviewItem v-for="project in projects" :key="project.title" :project="project"/>
  </div>
</template>

<script setup lang="ts">
import ProjectOverviewItem from '@/components/ProjectOverviewItem.vue';
import { projects } from '@/data/projects';
</script>

<style scoped>

.projects-container {
  display: grid;

  grid-template-columns: repeat(2, minmax(300px, auto));
  grid-auto-rows: auto;

  gap: 20px;
}

@media (max-width: 930px) {
  .projects-container {
    grid-template-columns: minmax(0, auto)
  }
}

</style>
