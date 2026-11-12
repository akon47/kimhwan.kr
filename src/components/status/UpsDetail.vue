<template>
  <DetailPanel :title="ups.model" :subtitle="subtitle" icon="🔋" :badge="statusLabel" :badge-tone="badgeTone" :width="600" @close="emit('close')">
    <div class="stats">
      <StatTile compact label="배터리 잔량" :value="formatNumber(ups.chargePct)" unit="%" :meter="ups.chargePct ?? 0" meter-invert/>
      <StatTile compact label="예상 버팀 시간" :value="formatNumber(ups.runtimeMin)" unit="분">지금 부하 기준</StatTile>
      <StatTile compact label="부하" :value="formatNumber(ups.loadPct)" unit="%">
        ≈ {{ watts ?? EMPTY }} W / 정격 {{ ups.nominalPowerW ?? EMPTY }} W
      </StatTile>
      <StatTile compact label="입력 전압" :value="formatNumber(ups.lineVolts, 1)" unit="V">정격 {{ details?.nominalInputV ?? EMPTY }} V</StatTile>
      <StatTile compact label="배터리 전압" :value="formatNumber(ups.batteryVolts, 1)" unit="V">정격 {{ details?.nominalBatteryV ?? EMPTY }} V</StatTile>
      <StatTile compact label="배터리 전환 횟수" :value="formatNumber(ups.transfers)" unit="회">apcupsd 시작 이후</StatTile>
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
        <summary>apcupsd 원본 전체 ({{ rawEntries.length }}개 항목)</summary>
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
    <p v-else class="pending">상세 항목은 상태 API 가 갱신된 뒤에 보입니다.</p>
  </DetailPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DetailPanel from '@/components/status/DetailPanel.vue';
import StatTile from '@/components/status/StatTile.vue';
import type { Health, UpsStatus } from '@/types/status';
import { EMPTY, formatNumber, formatSeconds } from '@/utils/format';

const props = defineProps<{ ups: UpsStatus }>();
const emit = defineEmits<{ close: [] }>();

const details = computed(() => props.ups.details);

/** apcupsd status flags in plain words. */
const STATUS_WORDS: Record<string, string> = {
  ONLINE: '전원 정상',
  ONBATT: '배터리 사용 중',
  LOWBATT: '배터리 부족',
  CAL: '보정 중',
  TRIM: 'AVR 전압 낮춤',
  BOOST: 'AVR 전압 올림',
  OVERLOAD: '과부하',
  REPLACEBATT: '배터리 교체 필요',
  NOBATT: '배터리 없음',
  COMMLOST: '통신 끊김',
  SHUTTING: '종료 중',
};

const statusLabel = computed(() => {
  const words = props.ups.status
    .split(/\s+/)
    .map((word) => STATUS_WORDS[word])
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
  return parts.length ? parts.join(' · ') : 'apcupsd 가 USB 로 읽은 상태';
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
  return value ? value.replace(/\s[+-]\d{4}$/, '') : '없음';
}

const groups = computed<{ title: string; note?: string; rows: [string, string][] }[]>(() => {
  const d = details.value;
  if (!d) {
    return [];
  }
  const ups = props.ups;
  return [
    {
      title: '안전 종료 조건',
      note: '하나라도 해당되면 Proxmox 호스트를 끕니다',
      rows: [
        ['배터리 잔량', `${withUnit(d.shutdownMinChargePct, '%')} 이하`],
        ['남은 시간', `${withUnit(d.shutdownMinRuntimeMin, '분')} 이하`],
        ['배터리 사용 시간', d.shutdownMaxOnBatterySec ? `${formatSeconds(d.shutdownMaxOnBatterySec)} 경과` : '제한 없음'],
      ],
    },
    {
      title: '정전 이력',
      rows: [
        ['마지막 전환 이유', ups.lastTransfer ?? EMPTY],
        ['마지막 배터리 전환', formatStamp(d.lastOnBatteryStart)],
        ['마지막 복귀', formatStamp(d.lastOnBatteryEnd)],
        ['이번 배터리 사용', formatSeconds(d.timeOnBatterySec)],
        ['누적 배터리 사용', formatSeconds(d.cumOnBatterySec)],
      ],
    },
    {
      title: '전압 전환 범위 · 감도',
      rows: [
        ['배터리로 넘어가는 입력 전압', `${withUnit(d.loTransferV, ' V')} 미만 또는 ${withUnit(d.hiTransferV, ' V')} 초과`],
        ['감도', d.sense ?? EMPTY],
        ['경고음 지연', d.alarmDelay ?? EMPTY],
        ['자가 진단', d.selfTest ?? EMPTY],
      ],
    },
    {
      title: '장비',
      rows: [
        ['이름', d.upsName ?? EMPTY],
        ['시리얼', d.serial ?? EMPTY],
        ['펌웨어', d.firmware ?? EMPTY],
        ['배터리 교체일', d.batteryDate ?? EMPTY],
        ['연결', [d.cable, d.driver, d.upsMode].filter(Boolean).join(' · ') || EMPTY],
        ['apcupsd', `${d.apcupsdVersion ?? EMPTY} · 시작 ${formatStamp(d.startedAt)}`],
        ['상태 플래그', d.statFlag ? `${ups.status} (${d.statFlag})` : ups.status],
        ['보고 시각', formatStamp(d.reportedAt)],
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
