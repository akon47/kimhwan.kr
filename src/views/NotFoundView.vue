<template>
  <div class="container not-found">
    <p class="not-found__code mono">404</p>
    <h1 class="not-found__title">{{ t.notFound.title }}</h1>
    <p class="not-found__text">{{ t.notFound.text }}</p>
    <RouterLink to="/" class="btn btn--primary">{{ t.notFound.back }}</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/i18n';

const { t } = useI18n();
</script>

<style scoped>
.not-found {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  padding-block: var(--space-16);
  text-align: center;
}

.not-found__code {
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}

.not-found__title {
  font-size: var(--text-2xl);
}

.not-found__text {
  margin-bottom: var(--space-4);
  color: var(--color-text-muted);
}
</style>
