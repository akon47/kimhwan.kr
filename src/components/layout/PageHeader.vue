<template>
  <header class="page-header">
    <div class="page-header__text">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="description" class="page-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions"/>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  eyebrow?: string;
  description?: string;
}>();
</script>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.page-header__text {
  display: grid;
  gap: var(--space-2);
  max-width: 44rem;
}

.page-header__title {
  font-size: var(--text-2xl);
}

.page-header__description {
  color: var(--color-text-muted);
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
</style>
