<template>
  <section class="banner" :class="`banner--${state}`" aria-live="polite">
    <StatusDot :state="state" large/>
    <div class="banner__text">
      <h2 class="banner__title">{{ title }}</h2>
      <p class="banner__detail">
        <template v-if="snapshot">
          {{ snapshot.summary.up }} 정상
          <template v-if="snapshot.summary.degraded"> · {{ snapshot.summary.degraded }} 일부 문제</template>
          <template v-if="snapshot.summary.down"> · {{ snapshot.summary.down }} 중단</template>
          · 집 서버 내부망에서 직접 점검
        </template>
        <template v-else-if="error">상태 API 에 연결할 수 없습니다 ({{ error }})</template>
        <template v-else>불러오는 중…</template>
      </p>
    </div>
    <div class="banner__meta">
      <span v-if="lastUpdated" class="tabular">{{ formatClock(lastUpdated) }} 기준 · {{ refreshSeconds }}초마다 갱신</span>
      <button type="button" class="btn btn--sm" :disabled="loading" @click="emit('refresh')">
        <AppIcon name="refresh" :size="14"/>
        새로고침
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import StatusDot from '@/components/ui/StatusDot.vue';
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

const TITLES: Record<Health, string> = {
  up: '모든 서비스가 정상입니다',
  degraded: '일부 서비스에 문제가 있습니다',
  down: '서비스가 중단됐습니다',
};

const title = computed(() => {
  if (props.snapshot) {
    return TITLES[props.snapshot.overall];
  }
  return props.error ? '상태를 확인할 수 없습니다' : '상태 확인 중';
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
