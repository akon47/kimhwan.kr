<template>
  <li class="guest" :class="{ 'guest--stopped': !running }">
    <div class="guest__head">
      <StatusDot :state="running ? 'up' : 'off'"/>
      <span class="guest__name">{{ guest.name }}</span>
      <span class="guest__type">{{ guest.type === 'qemu' ? 'VM' : 'LXC' }}</span>
      <span class="guest__id mono">#{{ guest.vmid }}</span>
    </div>

    <div v-if="running" class="guest__metrics tabular">
      <span class="metric">
        <span class="metric__label">CPU</span>
        <MeterBar :value="guest.cpuPct" class="metric__bar" :label="`${guest.name} CPU`"/>
        {{ guest.cpuPct.toFixed(1) }}%
      </span>
      <span class="metric">
        <span class="metric__label">RAM</span>
        <MeterBar :value="memoryPct" class="metric__bar" :label="`${guest.name} 메모리`"/>
        {{ formatGb(guest.mem) }} / {{ formatGb(guest.maxmem) }} GB
      </span>
      <span class="metric metric--uptime">⏱ {{ formatUptime(guest.uptimeSec) }}</span>
    </div>
    <div v-else class="guest__metrics">정지됨</div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MeterBar from '@/components/ui/MeterBar.vue';
import StatusDot from '@/components/ui/StatusDot.vue';
import type { GuestStatus } from '@/types/status';
import { formatGb, formatUptime, percentOf } from '@/utils/format';

const props = defineProps<{ guest: GuestStatus }>();

const running = computed(() => props.guest.status === 'running');
const memoryPct = computed(() => percentOf(props.guest.mem, props.guest.maxmem));
</script>

<style scoped>
.guest {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.guest--stopped {
  opacity: 0.55;
}

.guest__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.guest__name {
  min-width: 0;
  overflow: hidden;
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guest__type {
  flex-shrink: 0;
  padding: 1px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: var(--text-2xs);
}

.guest__id {
  flex-shrink: 0;
  margin-left: auto;
  color: var(--color-text-subtle);
  font-size: var(--text-2xs);
}

.guest__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

.metric {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
}

.metric__label {
  color: var(--color-text-subtle);
  font-size: 0.65625rem;
  letter-spacing: 0.04em;
}

.metric__bar {
  width: 46px;
  height: 5px;
}

.metric--uptime {
  color: var(--color-text-subtle);
}
</style>
