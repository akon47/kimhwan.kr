<template>
  <RouterLink to="/status" class="card card--interactive status-card">
    <div class="status-card__head">
      <StatusDot :state="state"/>
      <span class="status-card__title">{{ title }}</span>
      <span class="status-card__more">
        Live dashboard
        <AppIcon name="arrow-right" :size="14"/>
      </span>
    </div>

    <dl class="status-card__stats">
      <div v-for="stat in stats" :key="stat.label" class="stat">
        <dt class="stat__label">{{ stat.label }}</dt>
        <dd class="stat__value tabular">
          {{ stat.value }}<span v-if="stat.unit" class="stat__unit">{{ stat.unit }}</span>
        </dd>
      </div>
    </dl>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import StatusDot from '@/components/ui/StatusDot.vue';
import { fetchStatus } from '@/services/statusApi';
import type { Health, StatusSnapshot } from '@/types/status';
import { EMPTY, formatNumber, percentOf } from '@/utils/format';
import { runningGuestCount } from '@/utils/status';

/** A one-shot summary of the home server for the landing page. The full view is /status. */
const snapshot = shallowRef<StatusSnapshot | null>(null);
const failed = ref(false);
const controller = new AbortController();

onMounted(async () => {
  try {
    snapshot.value = await fetchStatus(controller.signal);
  } catch {
    failed.value = !controller.signal.aborted;
  }
});

onUnmounted(() => controller.abort());

const state = computed<Health | 'unknown'>(() => snapshot.value?.overall ?? (failed.value ? 'down' : 'unknown'));

const TITLES: Record<Health, string> = {
  up: 'All systems operational',
  degraded: 'Some services are degraded',
  down: 'Service outage',
};

const title = computed(() => {
  if (snapshot.value) {
    return TITLES[snapshot.value.overall];
  }
  return failed.value ? 'Status is unavailable right now' : 'Checking the home server…';
});

const stats = computed<{ label: string; value: string; unit?: string }[]>(() => {
  const s = snapshot.value;
  const host = s?.host;
  return [
    { label: 'Services up', value: s ? `${s.summary.up}` : EMPTY, unit: s ? ` / ${s.services.length}` : undefined },
    { label: 'VMs & containers', value: s ? `${runningGuestCount(s)}` : EMPTY },
    { label: 'CPU', value: formatNumber(host?.cpuPct), unit: host ? '%' : undefined },
    { label: 'Memory', value: host ? `${percentOf(host.mem.used, host.mem.total)}` : EMPTY, unit: host ? '%' : undefined },
    { label: 'UPS battery', value: formatNumber(s?.ups?.chargePct), unit: s?.ups ? '%' : undefined },
  ];
});
</script>

<style scoped>
.status-card {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-5) var(--space-6);
}

.status-card__head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.status-card__title {
  font-weight: var(--weight-semibold);
}

.status-card__more {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  white-space: nowrap;
  transition: color var(--duration-fast);
}

.status-card:hover .status-card__more {
  color: var(--color-accent);
}

.status-card__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
  gap: var(--space-4);
}

.stat__label {
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
}

.stat__value {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  letter-spacing: -0.02em;
}

.stat__unit {
  margin-left: 1px;
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

@media (max-width: 480px) {
  .status-card__more {
    display: none;
  }
}
</style>
