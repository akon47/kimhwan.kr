<template>
  <div class="backdrop" @click.self="emit('close')">
    <div class="panel" role="dialog" aria-modal="true" :aria-label="title" :style="{ width: `min(${width}px, 100%)` }">
      <div class="head">
        <span v-if="icon" class="icon">{{ icon }}</span>
        <div class="titles">
          <div class="name">{{ title }}</div>
          <div v-if="subtitle" class="desc">{{ subtitle }}</div>
        </div>
        <span v-if="badge" class="badge" :class="badgeClass">{{ badge }}</span>
        <button class="close" aria-label="닫기" @click="emit('close')">✕</button>
      </div>
      <slot/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    icon?: string;
    badge?: string;
    /** up | degraded | down — colours the badge. */
    badgeClass?: string;
    width?: number;
  }>(),
  { subtitle: '', icon: '', badge: '', badgeClass: '', width: 520 },
);

const emit = defineEmits<{ close: [] }>();

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close');
  }
}

onMounted(() => document.addEventListener('keydown', onKey));
onUnmounted(() => document.removeEventListener('keydown', onKey));
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 50;
}

.panel {
  max-height: 90vh;
  overflow-y: auto;
  background: var(--content-background-color);
  color: var(--base-color);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: grid;
  row-gap: 16px;
  align-content: start;
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon {
  font-size: 28px;
}

.titles {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 18px;
  font-weight: bold;
}

.desc {
  font-size: 13px;
  opacity: 0.7;
}

.badge {
  font-size: 12px;
  font-weight: bold;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--menu-hover-color);
  white-space: nowrap;
}

.badge.up { color: #2ea043; }
.badge.degraded { color: #d29922; }
.badge.down { color: #f85149; }

.close {
  padding: 4px 10px;
  font-size: 14px;
}
</style>
