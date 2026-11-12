<template>
  <a class="skip-link" href="#main">{{ t.layout.skipToContent }}</a>
  <AppHeader/>
  <main id="main" class="app-main">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component"/>
      </Transition>
    </RouterView>
  </main>
  <AppFooter/>
  <LiveCursors/>
  <DeployToasts/>
  <CommandPalette/>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppFooter from '@/components/layout/AppFooter.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import CommandPalette from '@/components/layout/CommandPalette.vue';
import DeployToasts from '@/components/live/DeployToasts.vue';
import LiveCursors from '@/components/live/LiveCursors.vue';
import { startLive } from '@/composables/useLive';
import { useI18n } from '@/i18n';

// Realtime extras (who is online, shared cursors, deploy toasts). The site works the same without them.
startLive(useRouter());

const { t } = useI18n();
</script>

<style scoped>
.app-main {
  flex: 1;
  overflow-x: clip;
  padding-block: var(--space-10) var(--space-20);
}

.skip-link {
  position: fixed;
  top: var(--space-2);
  left: var(--space-2);
  z-index: calc(var(--z-header) + 1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-text);
  color: var(--color-bg);
  font-size: var(--text-sm);
  transform: translateY(-200%);
}

.skip-link:focus {
  transform: none;
}

.page-enter-active,
.page-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
}
</style>
