<template>
  <DetailPanel :title="ups.model" :subtitle="subtitle" icon="🔋" :badge="statusLabel" :badge-tone="badgeTone" :width="600" @close="emit('close')">
    <div class="stats">
      <StatTile compact :label="text.charge" :value="formatNumber(ups.chargePct)" unit="%" :meter="ups.chargePct ?? 0" meter-invert/>
      <StatTile compact :label="text.runtime" :value="formatNumber(ups.runtimeMin)" :unit="text.minutesUnit">{{ text.runtimeNote }}</StatTile>
      <StatTile compact :label="text.load" :value="formatNumber(ups.loadPct)" unit="%">
        {{ text.loadNote(`${watts ?? EMPTY}`, `${ups.nominalPowerW ?? EMPTY}`) }}
      </StatTile>
      <StatTile compact :label="text.inputVoltage" :value="formatNumber(ups.lineVolts, 1)" unit="V">
        {{ text.nominal(`${details?.nominalInputV ?? EMPTY}`) }}
      </StatTile>
      <StatTile compact :label="text.batteryVoltage" :value="formatNumber(ups.batteryVolts, 1)" unit="V">
        {{ text.nominal(`${details?.nominalBatteryV ?? EMPTY}`) }}
      </StatTile>
      <StatTile compact :label="text.transfers" :value="formatNumber(ups.transfers)" :unit="text.transfersUnit">{{ text.transfersNote }}</StatTile>
    </div>

    <template v-if="details">
      <section v-for="group in groups" :key="group.title" class="group">
        <h3 class="group__title">
          {{ group.title }} <small v-if="group.note">{{ group.note }}</small>
        </h3>
        <dl class="rows">
          <template v-for="[term, value] in group.rows" :key="term">
            <dt>{{ term }}</dt>
            <dd>{{ value }}</dd>
          </template>
        </dl>
      </section>

      <details class="raw">
        <summary>{{ text.raw(rawEntries.length) }}</summary>
        <table>
          <tbody>
            <tr v-for="[key, value] in rawEntries" :key="key">
              <th scope="row">{{ key }}</th>
              <td>{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </details>
    </template>
    <p v-else class="pending">{{ text.pending }}</p>
  </DetailPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DetailPanel from '@/components/status/DetailPanel.vue';
import StatTile from '@/components/status/StatTile.vue';
import { useI18n } from '@/i18n';
import type { Health, UpsStatus } from '@/types/status';
import { EMPTY, formatNumber, formatSeconds } from '@/utils/format';

const props = defineProps<{ ups: UpsStatus }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const text = computed(() => t.value.status.ups);

const details = computed(() => props.ups.details);

/** apcupsd prints its state as flags ("ONLINE", "ONBATT LOWBATT"); the texts have them in plain words. */
const statusLabel = computed(() => {
  const words = props.ups.status
    .split(/\s+/)
    .map((word) => text.value.flags[word])
    .filter((word): word is string => !!word);
  return words.length ? words.join(' · ') : props.ups.status;
});

const badgeTone = computed<Health>(() => {
  const status = props.ups.status;
  if (/LOWBATT|COMMLOST|OVERLOAD|REPLACEBATT|NOBATT|SHUTTING/.test(status)) {
    return 'down';
  }
  if (/ONBATT|TRIM|BOOST|CAL/.test(status)) {
    return 'degraded';
  }
  return /ONLINE/.test(status) ? 'up' : 'degraded';
});

const subtitle = computed(() => {
  const d = details.value;
  const parts = [d?.upsName, d?.serial ? `S/N ${d.serial}` : null].filter((part): part is string => !!part);
  return parts.length ? parts.join(' · ') : text.value.subtitle;
});

const watts = computed(() => {
  const { loadPct, nominalPowerW } = props.ups;
  return loadPct !== null && nominalPowerW !== null ? Math.round((loadPct / 100) * nominalPowerW) : null;
});

const rawEntries = computed(() => Object.entries(details.value?.raw ?? {}));

function withUnit(value: number | null, unit: string): string {
  return value === null ? EMPTY : `${value}${unit}`;
}

/** apcupsd prints "2026-10-21 13:14:02 +0900"; the zone is always ours. */
function formatStamp(value: string | null): string {
  return value ? value.replace(/\s[+-]\d{4}$/, '') : text.value.none;
}

const groups = computed<{ title: string; note?: string; rows: [string, string][] }[]>(() => {
  const d = details.value;
  if (!d) {
    return [];
  }
  const ups = props.ups;
  const { shutdown, history, transfer, device, minutesUnit } = text.value;
  return [
    {
      title: shutdown.title,
      note: shutdown.note,
      rows: [
        [shutdown.charge, shutdown.atMost(withUnit(d.shutdownMinChargePct, '%'))],
        [shutdown.runtime, shutdown.atMost(withUnit(d.shutdownMinRuntimeMin, minutesUnit))],
        [shutdown.onBattery, d.shutdownMaxOnBatterySec ? shutdown.after(formatSeconds(d.shutdownMaxOnBatterySec)) : shutdown.noLimit],
      ],
    },
    {
      title: history.title,
      rows: [
        [history.reason, ups.lastTransfer ?? EMPTY],
        [history.lastStart, formatStamp(d.lastOnBatteryStart)],
        [history.lastEnd, formatStamp(d.lastOnBatteryEnd)],
        [history.current, formatSeconds(d.timeOnBatterySec)],
        [history.cumulative, formatSeconds(d.cumOnBatterySec)],
      ],
    },
    {
      title: transfer.title,
      rows: [
        [transfer.range, transfer.rangeValue(withUnit(d.loTransferV, ' V'), withUnit(d.hiTransferV, ' V'))],
        [transfer.sensitivity, d.sense ?? EMPTY],
        [transfer.alarmDelay, d.alarmDelay ?? EMPTY],
        [transfer.selfTest, d.selfTest ?? EMPTY],
      ],
    },
    {
      title: device.title,
      rows: [
        [device.name, d.upsName ?? EMPTY],
        [device.serial, d.serial ?? EMPTY],
        [device.firmware, d.firmware ?? EMPTY],
        [device.batteryDate, d.batteryDate ?? EMPTY],
        [device.connection, [d.cable, d.driver, d.upsMode].filter(Boolean).join(' · ') || EMPTY],
        ['apcupsd', `${d.apcupsdVersion ?? EMPTY} · ${device.started(formatStamp(d.startedAt))}`],
        [device.flags, d.statFlag ? `${ups.status} (${d.statFlag})` : ups.status],
        [device.reportedAt, formatStamp(d.reportedAt)],
      ],
    },
  ];
});
</script>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

@media (max-width: 520px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.group {
  display: grid;
  gap: var(--space-2);
}

.group__title {
  font-size: var(--text-sm);
  letter-spacing: 0;
}

.group__title small {
  margin-left: var(--space-1);
  color: var(--color-text-subtle);
  font-weight: var(--weight-regular);
}

.rows {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--space-1) var(--space-4);
  font-size: var(--text-sm);
}

.rows dt {
  color: var(--color-text-subtle);
}

.raw summary {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  cursor: pointer;
  user-select: none;
}

.raw table {
  width: 100%;
  margin-top: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.raw th,
.raw td {
  padding: 3px var(--space-2);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: top;
}

.raw th {
  color: var(--color-text-subtle);
  font-weight: var(--weight-regular);
  white-space: nowrap;
}

.pending {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>
