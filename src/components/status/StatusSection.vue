<template>
  <section class="section">
    <header class="section__head">
      <h2 class="section__title">{{ title }}</h2>
      <span v-if="note" class="section__note">{{ note }}</span>
    </header>
    <slot/>
  </section>
</template>

<script setup lang="ts">
/** A titled block of the dashboard. */
defineProps<{
  title: string;
  note?: string;
}>();
</script>

<style scoped>
.section {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}

.section__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1) var(--space-3);
}

.section__title {
  font-size: var(--text-lg);
}

.section__note {
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}
</style>
