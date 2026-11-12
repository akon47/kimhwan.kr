<template>
  <article
    class="card card--interactive service"
    :class="`service--${service.health}`"
    role="button"
    tabindex="0"
    :aria-label="text.details(service.name)"
    @click="emit('select')"
    @keydown.enter.self="emit('select')"
    @keydown.space.self.prevent="emit('select')"
  >
    <header class="service__head">
      <span class="service__icon" aria-hidden="true">{{ service.icon }}</span>
      <h3 class="service__name">{{ service.name }}</h3>
      <StatusDot :state="service.health"/>
    </header>

    <p class="service__desc">{{ serviceDescription(service) }}</p>

    <p class="service__stats tabular">
      <strong :class="`tone-${service.health}`">{{ healthLabel(service.health) }}</strong>
      <span v-if="service.latencyMs !== null">{{ service.latencyMs }} ms</span>
      <span v-if="hasUptime" :title="text.uptimeTitle">
        {{ formatAvailability(stats?.uptime24hPct) }} <small>24h</small> · {{ formatAvailability(stats?.uptime30dPct) }} <small>30d</small>
      </span>
    </p>

    <SparkLine v-if="latencySeries.length > 1" :values="latencySeries" :width="220" :height="22" class="service__spark"/>

    <footer class="service__foot">
      <ul class="checks">
        <li v-for="check in service.checks" :key="check.name" class="check" :class="{ 'check--failed': !check.ok }" :title="describeCheck(check)">
          {{ check.ok ? '✓' : '✗' }} {{ check.name }}
        </li>
      </ul>
      <span class="service__links" @click.stop>
        <a v-if="service.url" :href="service.url" target="_blank" rel="noopener" :aria-label="text.open(service.name)" :title="t.common.open">
          <AppIcon name="arrow-up-right" :size="13"/>
        </a>
        <a v-for="repo in service.repos ?? []" :key="repo" :href="repo" target="_blank" rel="noopener" :title="repo" :aria-label="text.repository">
          <AppIcon name="github" :size="13"/>
        </a>
      </span>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import SparkLine from '@/components/ui/SparkLine.vue';
import StatusDot from '@/components/ui/StatusDot.vue';
import { useI18n } from '@/i18n';
import type { ServiceStats, ServiceStatus } from '@/types/status';
import { formatAvailability } from '@/utils/format';
import { describeCheck, healthLabel, serviceDescription } from '@/utils/status';

const props = defineProps<{
  service: ServiceStatus;
  /** Uptime and latency history; arrives later than the snapshot. */
  stats?: ServiceStats;
}>();

const emit = defineEmits<{ select: [] }>();

const { t } = useI18n();
const text = computed(() => t.value.status.service);

const hasUptime = computed(() => typeof props.stats?.uptime24hPct === 'number');
const latencySeries = computed(() => props.stats?.latency24h ?? []);
</script>

<style scoped>
.service {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-4);
  cursor: pointer;
  user-select: none;
}

.service:hover {
  border-color: var(--color-accent);
}

.service--degraded {
  border-color: color-mix(in srgb, var(--color-warning) 60%, transparent);
}

.service--down {
  border-color: color-mix(in srgb, var(--color-danger) 60%, transparent);
}

.service__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.service__icon {
  font-size: 1.125rem;
  line-height: 1;
}

.service__name {
  flex: 1;
  overflow: hidden;
  font-size: var(--text-base);
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service__desc {
  min-height: 2.6em;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: 1.3;
}

.service__stats {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1) var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

.service__stats small {
  color: var(--color-text-subtle);
  font-size: 0.625rem;
}

.service__spark {
  width: 100%;
}

.service__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.checks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.check {
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: var(--text-2xs);
}

.check--failed {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.service__links {
  display: flex;
  gap: var(--space-1);
  margin-left: auto;
}

.service__links a {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  transition:
    background-color var(--duration-fast),
    color var(--duration-fast);
}

.service__links a:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}
</style>
