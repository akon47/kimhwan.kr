<template>
  <Teleport to="body">
    <div class="backdrop" @click.self="emit('close')">
      <div
        ref="panel"
        class="panel"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        :style="{ width: `min(${width}px, 100%)` }"
      >
        <header class="head">
          <span v-if="icon" class="head__icon" aria-hidden="true">{{ icon }}</span>
          <div class="head__titles">
            <h2 class="head__name">{{ title }}</h2>
            <p v-if="subtitle" class="head__desc">{{ subtitle }}</p>
          </div>
          <span v-if="badge" class="badge" :class="badgeTone ? `badge--${badgeTone}` : undefined">{{ badge }}</span>
          <button type="button" class="btn btn--ghost btn--icon" aria-label="닫기" @click="emit('close')">
            <AppIcon name="close"/>
          </button>
        </header>
        <slot/>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { Health } from '@/types/status';

/** Modal shell for the dashboard's detail views. Closes on Escape, backdrop click or the close button. */
withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    /** Emoji shown before the title. */
    icon?: string;
    badge?: string;
    badgeTone?: Health;
    /** Maximum width in px. */
    width?: number;
  }>(),
  { subtitle: '', icon: '', badge: '', badgeTone: undefined, width: 520 },
);

const emit = defineEmits<{ close: [] }>();

const panel = useTemplateRef<HTMLElement>('panel');
let previousFocus: Element | null = null;
let previousOverflow = '';

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close');
  }
}

onMounted(() => {
  previousFocus = document.activeElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKeydown);
  panel.value?.focus();
});

onUnmounted(() => {
  document.body.style.overflow = previousOverflow;
  document.removeEventListener('keydown', onKeydown);
  if (previousFocus instanceof HTMLElement) {
    previousFocus.focus();
  }
});
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-dialog);
  display: grid;
  place-items: center;
  padding: var(--space-4);
  background: var(--color-backdrop);
  backdrop-filter: blur(3px);
  animation: fade-in var(--duration-base) var(--ease-out);
}

.panel {
  display: grid;
  align-content: start;
  gap: var(--space-4);
  max-height: 90dvh;
  padding: var(--space-5);
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  outline: none;
  animation: pop-in var(--duration-base) var(--ease-out);
}

.head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.head__icon {
  font-size: 1.75rem;
  line-height: 1;
}

.head__titles {
  flex: 1;
  min-width: 0;
}

.head__name {
  font-size: var(--text-lg);
}

.head__desc {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.badge {
  padding: 3px var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-surface-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  white-space: nowrap;
}

.badge--up {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.badge--degraded {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.badge--down {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
}
</style>
