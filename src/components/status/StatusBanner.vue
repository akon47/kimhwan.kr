<template>
  <section class="banner" :class="`banner--${state}`" aria-live="polite">
    <StatusDot :state="state" large/>
    <div class="banner__text">
      <h2 class="banner__title">{{ title }}</h2>
      <p class="banner__detail">
        <template v-if="snapshot">
          {{ text.countUp(snapshot.summary.up) }}
          <template v-if="snapshot.summary.degraded"> · {{ text.countDegraded(snapshot.summary.degraded) }}</template>
          <template v-if="snapshot.summary.down"> · {{ text.countDown(snapshot.summary.down) }}</template>
          · {{ text.probed }}
        </template>
        <template v-else-if="error">{{ text.apiError(error) }}</template>
        <template v-else>{{ t.common.loading }}</template>
      </p>
    </div>
    <div class="banner__meta">
      <span v-if="lastUpdated" class="tabular">{{ text.updated(formatClock(lastUpdated), refreshSeconds) }}</span>
      <button type="button" class="btn btn--sm" :disabled="loading" @click="emit('refresh')">
        <AppIcon name="refresh" :size="14"/>
        {{ t.common.refresh }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import StatusDot from '@/components/ui/StatusDot.vue';
import { useI18n } from '@/i18n';
import type { Health, StatusSnapshot } from '@/types/status';
import { formatClock } from '@/utils/format';

const props = defineProps<{
  snapshot: StatusSnapshot | null;
  error: string | null;
  loading: boolean;
  lastUpdated: Date | null;
  refreshSeconds: number;
}>();

const emit = defineEmits<{ refresh: [] }>();

const state = computed<Health | 'unknown'>(() => props.snapshot?.overall ?? (props.error ? 'down' : 'unknown'));

const { t } = useI18n();
const text = computed(() => t.value.status.banner);

const title = computed(() => {
  if (props.snapshot) {
    return text.value[props.snapshot.overall];
  }
  return props.error ? text.value.unavailable : text.value.checking;
});
</script>

<style scoped>
.banner {
  --banner-color: var(--color-neutral);

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4) var(--space-5);
  padding: var(--space-5) var(--space-6);
  border: 1px solid color-mix(in srgb, var(--banner-color) 35%, var(--color-border));
  border-radius: var(--radius-lg);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--banner-color) 9%, transparent), transparent 60%),
    var(--color-surface);
}

.banner--up {
  --banner-color: var(--color-success);
}

.banner--degraded {
  --banner-color: var(--color-warning);
}

.banner--down {
  --banner-color: var(--color-danger);
}

.banner__text {
  flex: 1;
  min-width: 14rem;
}

.banner__title {
  font-size: var(--text-lg);
}

.banner__detail {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.banner__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
}
</style>
