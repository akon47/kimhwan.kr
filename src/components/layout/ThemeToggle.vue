<template>
  <button
    type="button"
    class="btn btn--ghost btn--icon"
    :aria-label="isDark ? t.theme.toLight : t.theme.toDark"
    :title="isDark ? t.theme.light : t.theme.dark"
    @click="toggleTheme"
  >
    <Transition name="swap" mode="out-in">
      <AppIcon :key="theme" :name="isDark ? 'moon' : 'sun'"/>
    </Transition>
  </button>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import { useTheme } from '@/composables/useTheme';
import { useI18n } from '@/i18n';

const { theme, isDark, toggleTheme } = useTheme();
const { t } = useI18n();
</script>

<style scoped>
.swap-enter-active,
.swap-leave-active {
  transition:
    opacity var(--duration-fast),
    transform var(--duration-fast);
}

.swap-enter-from {
  opacity: 0;
  transform: rotate(-60deg) scale(0.7);
}

.swap-leave-to {
  opacity: 0;
  transform: rotate(60deg) scale(0.7);
}
</style>
