<template>
  <button
    type="button"
    class="btn btn--ghost btn--icon"
    :aria-label="isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
    :title="isDark ? '라이트 모드' : '다크 모드'"
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

const { theme, isDark, toggleTheme } = useTheme();
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
