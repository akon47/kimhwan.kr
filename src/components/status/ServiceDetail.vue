<template>
  <DetailPanel
    :title="service.name"
    :subtitle="service.description"
    :icon="service.icon"
    :badge="healthLabel(service.health)"
    :badge-tone="service.health"
    @close="emit('close')"
  >
    <div v-if="service.url || service.repos?.length" class="links">
      <a v-if="service.url" :href="service.url" target="_blank" rel="noopener" class="btn btn--sm btn--primary">
        열기
        <AppIcon name="arrow-up-right" :size="14"/>
      </a>
      <a v-for="repo in service.repos" :key="repo" :href="repo" target="_blank" rel="noopener" class="btn btn--sm">
        <AppIcon name="github" :size="14"/>
        {{ repoLabel(repo) }}
      </a>
    </div>

    <div class="stats">
      <StatTile compact label="가동률 24h" :value="formatAvailability(stats?.uptime24hPct)"/>
      <StatTile compact label="가동률 30d" :value="formatAvailability(stats?.uptime30dPct)"/>
      <StatTile compact label="응답 (지금 / 24h 평균)" :value="latencyText"/>
      <StatTile compact :label="`최근 ${windowMinutes}분 트래픽`" :value="trafficText"/>
    </div>

    <section v-if="stats?.latency24h.some((value) => value !== null)" class="section">
      <h3 class="section__title">응답 시간 24h (ms)</h3>
      <SparkLine :values="stats.latency24h" :width="440" :height="48" class="spark"/>
    </section>

    <section class="section">
      <h3 class="section__title">점검 항목</h3>
      <ul class="checks">
        <li v-for="check in service.checks" :key="check.name" class="check" :class="{ 'check--failed': !check.ok }">
          <AppIcon :name="check.ok ? 'check' : 'close'" :size="14" class="check__mark"/>
          <span class="check__name">{{ check.name }}</span>
          <span class="check__meta tabular">
            <template v-if="check.status">HTTP {{ check.status }} · </template>{{ check.ms }} ms<template v-if="check.error"> · {{ check.error }}</template>
          </span>
        </li>
      </ul>
    </section>
  </DetailPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DetailPanel from '@/components/status/DetailPanel.vue';
import StatTile from '@/components/status/StatTile.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import SparkLine from '@/components/ui/SparkLine.vue';
import type { ServiceStats, ServiceStatus } from '@/types/status';
import { EMPTY, formatAvailability, formatBps, formatRate } from '@/utils/format';
import { healthLabel, type TrafficRate } from '@/utils/status';

const props = defineProps<{
  service: ServiceStatus;
  stats?: ServiceStats;
  traffic?: TrafficRate;
  windowMinutes: number;
}>();

const emit = defineEmits<{ close: [] }>();

const latencyText = computed(() => `${props.service.latencyMs ?? EMPTY} ms / ${props.stats?.avgLatency24hMs ?? EMPTY} ms`);

const trafficText = computed(() => {
  const t = props.traffic;
  return t ? `${formatRate(t.rpm)} · ↑${formatBps(t.bpsOut)} ↓${formatBps(t.bpsIn)}` : EMPTY;
});

/** "https://github.com/akon47/visit-counter" → "akon47/visit-counter" */
function repoLabel(url: string): string {
  return url.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
}
</script>

<style scoped>
.links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.section {
  display: grid;
  gap: var(--space-2);
}

.section__title {
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: 0;
}

.spark {
  width: 100%;
}

.checks {
  display: grid;
  gap: var(--space-2);
}

.check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  font-size: var(--text-sm);
}

.check__mark {
  color: var(--color-success);
}

.check--failed {
  background: var(--color-danger-soft);
}

.check--failed .check__mark {
  color: var(--color-danger);
}

.check__name {
  font-weight: var(--weight-semibold);
}

.check__meta {
  margin-left: auto;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  text-align: right;
}
</style>
