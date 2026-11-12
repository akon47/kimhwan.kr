<template>
  <div class="host">
    <div class="tiles">
      <StatTile label="CPU" :value="host.cpuPct.toFixed(1)" unit="%" :meter="host.cpuPct" :series="cpuSeries">
        {{ text.cpuNote(host.cpuCount, host.load1.toFixed(2)) }}<template v-if="hasCpuTrend"> · 24h</template>
      </StatTile>

      <StatTile :label="text.memory" :value="memoryPct" unit="%" :meter="memoryPct" :series="memSeries">
        {{ formatGb(host.mem.used) }} / {{ formatGb(host.mem.total) }} GB
        <template v-if="host.swap.used > 0"> · swap {{ formatGb(host.swap.used) }} GB</template>
      </StatTile>

      <StatTile
        v-for="storage in mainStorages"
        :key="storage.name"
        :label="storageLabel(storage.name)"
        :value="percentOf(storage.used, storage.total)"
        unit="%"
        :meter="percentOf(storage.used, storage.total)"
      >
        {{ formatGb(storage.used) }} / {{ formatGb(storage.total) }} GB
      </StatTile>

      <StatTile :label="text.uptime" :value="formatUptime(host.uptimeSec)">{{ pveVersion }} · {{ host.kernel }}</StatTile>

      <StatTile
        v-if="ups"
        label="🔋 UPS"
        :value="formatNumber(ups.chargePct)"
        unit="%"
        :meter="ups.chargePct ?? 0"
        meter-invert
        :warn="ups.onBattery"
        interactive
        :title="text.upsTitle"
        @click="emit('openUps')"
      >
        {{ ups.onBattery ? text.onBattery : text.powerOk }} · {{ text.upsNote(formatNumber(ups.loadPct), formatNumber(ups.runtimeMin)) }}
      </StatTile>

      <StatTile v-if="backup" :label="text.lastBackup" :value="backup.status === 'OK' ? text.backupOk : backup.status" :warn="backup.status !== 'OK'">
        {{ formatShortDate(backup.startedAt) }}
        <template v-if="backup.durationSec !== null"> · {{ text.backupTook(Math.round(backup.durationSec / 60)) }}</template>
      </StatTile>
    </div>

    <ul v-if="disks.length" class="disks">
      <li v-for="disk in disks" :key="disk.device" class="disk" :class="{ 'disk--bad': !isHealthy(disk) }">
        {{ isSolidState(disk) ? '⚡' : '💿' }} {{ disk.model }} · {{ (disk.sizeBytes / 1e12).toFixed(1) }} TB · {{ disk.health }}
        <template v-if="disk.wearPct !== null"> · {{ text.diskWear(disk.wearPct) }}</template>
        <template v-if="disk.tempC !== null"> · {{ disk.tempC }}℃</template>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatTile from '@/components/status/StatTile.vue';
import { useI18n } from '@/i18n';
import type { BackupStatus, DiskStatus, HistoryResponse, HostStatus, StorageStatus, UpsStatus } from '@/types/status';
import { formatGb, formatNumber, formatShortDate, formatUptime, percentOf } from '@/utils/format';

/** Storages worth a tile; the rest (ISO store, empty pools) are noise here. Their labels are in the texts. */
const MAIN_STORAGES = ['local-lvm', 'local-hdd'] as const;

const props = defineProps<{
  host: HostStatus;
  storages: StorageStatus[];
  disks: DiskStatus[];
  ups: UpsStatus | null;
  backup: BackupStatus | null;
  history: HistoryResponse | null;
}>();

const emit = defineEmits<{ openUps: [] }>();

const { t } = useI18n();
const text = computed(() => t.value.status.host);

function storageLabel(name: string): string {
  return (text.value.storages as Record<string, string>)[name] ?? name;
}

const memoryPct = computed(() => percentOf(props.host.mem.used, props.host.mem.total));
const mainStorages = computed(() => props.storages.filter((storage) => (MAIN_STORAGES as readonly string[]).includes(storage.name)));

const cpuSeries = computed(() => props.history?.points.map((point) => point.cpuPct) ?? []);
const memSeries = computed(() => props.history?.points.map((point) => point.memPct) ?? []);
const hasCpuTrend = computed(() => cpuSeries.value.length > 1);

/** "pve-manager/8.4.21/abc123" → "PVE 8.4.21" */
const pveVersion = computed(() => props.host.pveVersion.replace('pve-manager/', 'PVE ').split('/')[0]);

function isHealthy(disk: DiskStatus): boolean {
  return disk.health === 'PASSED' || disk.health === 'OK';
}

function isSolidState(disk: DiskStatus): boolean {
  return disk.type === 'nvme' || disk.type === 'ssd';
}
</script>

<style scoped>
.host {
  display: grid;
  gap: var(--space-3);
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: var(--space-3);
}

.disks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.disk {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

.disk--bad {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
</style>
