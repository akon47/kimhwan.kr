<template>
  <div class="header">
    <AppHeader />
  </div>
  <div class="content">
    <AppContent />
  </div>
  <div class="footer">
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import AppHeader from '@/components/common/AppHeader.vue';
import AppContent from '@/components/common/AppContent.vue';
import AppFooter from '@/components/common/AppFooter.vue';
import { useTheme } from '@/composables/useTheme';

const { theme } = useTheme();

watch(
  theme,
  (value) => {
    document.documentElement.className = value;
  },
  { immediate: true },
);
</script>
