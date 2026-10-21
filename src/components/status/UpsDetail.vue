<template>
  <DetailPanel :title="ups.model" :subtitle="subtitle" icon="🔋" :badge="statusLabel" :badge-class="badgeClass" :width="600" @close="emit('close')">
    <div class="grid">
      <div class="stat">
        <div class="label">배터리 잔량</div>
        <div class="value">{{ n(ups.chargePct, 0) }}<small>%</small></div>
        <div class="bar"><span :style="{ width: `${Math.min(100, ups.chargePct ?? 0)}%` }"/></div>
      </div>
      <div class="stat">
        <div class="label">예상 버팀 시간</div>
        <div class="value">{{ n(ups.runtimeMin, 0) }}<small>분</small></div>
        <div class="note">지금 부하 기준</div>
      </div>
      <div class="stat">
        <div class="label">부하</div>
        <div class="value">{{ n(ups.loadPct, 0) }}<small>%</small></div>
        <div class="note">≈ {{ watts ?? '–' }} W / 정격 {{ ups.nominalPowerW ?? '–' }} W</div>
      </div>
      <div class="stat">
        <div class="label">입력 전압</div>
        <div class="value">{{ n(ups.lineVolts, 1) }}<small>V</small></div>
        <div class="note">정격 {{ d?.nominalInputV ?? '–' }} V</div>
      </div>
      <div class="stat">
        <div class="label">배터리 전압</div>
        <div class="value">{{ n(ups.batteryVolts, 1) }}<small>V</small></div>
        <div class="note">정격 {{ d?.nominalBatteryV ?? '–' }} V</div>
      </div>
      <div class="stat">
        <div class="label">배터리 전환 횟수</div>
        <div class="value">{{ n(ups.transfers, 0) }}<small>회</small></div>
        <div class="note">apcupsd 시작 이후</div>
      </div>
    </div>

    <template v-if="d">
      <section>
        <h5>안전 종료 조건 <small>하나라도 해당되면 Proxmox 호스트를 끕니다</small></h5>
        <div class="rows">
          <span>배터리 잔량</span><span>{{ v(d.shutdownMinChargePct, '%') }} 이하</span>
          <span>남은 시간</span><span>{{ v(d.shutdownMinRuntimeMin, '분') }} 이하</span>
          <span>배터리 사용 시간</span><span>{{ d.shutdownMaxOnBatterySec ? `${fmtSec(d.shutdownMaxOnBatterySec)} 경과` : '제한 없음' }}</span>
        </div>
      </section>

      <section>
        <h5>정전 이력</h5>
        <div class="rows">
          <span>마지막 전환 이유</span><span>{{ ups.lastTransfer ?? '–' }}</span>
          <span>마지막 배터리 전환</span><span>{{ fmtDate(d.lastOnBatteryStart) }}</span>
          <span>마지막 복귀</span><span>{{ fmtDate(d.lastOnBatteryEnd) }}</span>
          <span>이번 배터리 사용</span><span>{{ fmtSec(d.timeOnBatterySec) }}</span>
          <span>누적 배터리 사용</span><span>{{ fmtSec(d.cumOnBatterySec) }}</span>
        </div>
      </section>

      <section>
        <h5>전압 전환 범위 · 감도</h5>
        <div class="rows">
          <span>배터리로 넘어가는 입력 전압</span><span>{{ v(d.loTransferV, ' V') }} 미만 또는 {{ v(d.hiTransferV, ' V') }} 초과</span>
          <span>감도</span><span>{{ d.sense ?? '–' }}</span>
          <span>경고음 지연</span><span>{{ d.alarmDelay ?? '–' }}</span>
          <span>자가 진단</span><span>{{ d.selfTest ?? '–' }}</span>
        </div>
      </section>

      <section>
        <h5>장비</h5>
        <div class="rows">
          <span>이름</span><span>{{ d.upsName ?? '–' }}</span>
          <span>시리얼</span><span>{{ d.serial ?? '–' }}</span>
          <span>펌웨어</span><span>{{ d.firmware ?? '–' }}</span>
          <span>배터리 교체일</span><span>{{ d.batteryDate ?? '–' }}</span>
          <span>연결</span><span>{{ [d.cable, d.driver, d.upsMode].filter(Boolean).join(' · ') || '–' }}</span>
          <span>apcupsd</span><span>{{ d.apcupsdVersion ?? '–' }} · 시작 {{ fmtDate(d.startedAt) }}</span>
          <span>상태 플래그</span><span>{{ ups.status }}<template v-if="d.statFlag"> ({{ d.statFlag }})</template></span>
          <span>보고 시각</span><span>{{ fmtDate(d.reportedAt) }}</span>
        </div>
      </section>

      <details class="raw">
        <summary>apcupsd 원본 전체 ({{ rawEntries.length }}개 항목)</summary>
        <table>
          <tbody>
            <tr v-for="[k, val] in rawEntries" :key="k">
              <th>{{ k }}</th>
              <td>{{ val }}</td>
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
import type { UpsStatus } from '@/types/status';

const props = defineProps<{ ups: UpsStatus }>();
const emit = defineEmits<{ close: [] }>();

const d = computed(() => props.ups.details);

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
  const words = props.ups.status.split(/\s+/).map((w) => STATUS_WORDS[w]).filter((w): w is string => !!w);
  return words.length ? words.join(' · ') : props.ups.status;
});

const badgeClass = computed(() => {
  const s = props.ups.status;
  if (/LOWBATT|COMMLOST|OVERLOAD|REPLACEBATT|NOBATT|SHUTTING/.test(s)) {
    return 'down';
  }
  if (/ONBATT|TRIM|BOOST|CAL/.test(s)) {
    return 'degraded';
  }
  return /ONLINE/.test(s) ? 'up' : 'degraded';
});

const subtitle = computed(() => {
  const parts = [d.value?.upsName, d.value?.serial ? `S/N ${d.value.serial}` : null].filter((x): x is string => !!x);
  return parts.length ? parts.join(' · ') : 'apcupsd 가 USB 로 읽은 상태';
});

const watts = computed(() =>
  props.ups.loadPct !== null && props.ups.nominalPowerW !== null ? Math.round((props.ups.loadPct / 100) * props.ups.nominalPowerW) : null,
);

const rawEntries = computed(() => Object.entries(d.value?.raw ?? {}));

function n(x: number | null, digits: number): string {
  return x === null ? '–' : x.toFixed(digits);
}

function v(x: number | null, unit: string): string {
  return x === null ? '–' : `${x}${unit}`;
}

function fmtSec(s: number | null): string {
  if (s === null) {
    return '–';
  }
  if (s < 60) {
    return `${s}초`;
  }
  if (s < 3600) {
    return `${Math.floor(s / 60)}분 ${s % 60}초`;
  }
  return `${Math.floor(s / 3600)}시간 ${Math.floor((s % 3600) / 60)}분`;
}

function fmtDate(s: string | null): string {
  // apcupsd prints "2026-10-21 13:14:02 +0900"; the zone is always ours.
  return s ? s.replace(/\s[+-]\d{4}$/, '') : '없음';
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

@media (max-width: 520px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat {
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

.label {
  font-size: 11px;
  opacity: 0.65;
  margin-bottom: 4px;
}

.value {
  font-size: 20px;
  font-weight: bold;
}

.value small {
  font-size: 11px;
  font-weight: normal;
  opacity: 0.7;
  margin-left: 2px;
}

.note {
  font-size: 11px;
  opacity: 0.65;
  margin-top: 2px;
}

.bar {
  height: 5px;
  margin-top: 6px;
  border-radius: 3px;
  background: var(--menu-hover-color);
  overflow: hidden;
}

.bar span {
  display: block;
  height: 100%;
  background: #2ea043;
  border-radius: 3px;
}

section h5 {
  margin: 0 0 6px;
  font-size: 13px;
}

section h5 small {
  font-weight: normal;
  opacity: 0.6;
  margin-left: 6px;
}

.rows {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 14px;
  row-gap: 5px;
  font-size: 13px;
}

.rows > span:nth-child(odd) {
  opacity: 0.65;
}

.raw summary {
  cursor: pointer;
  font-size: 12px;
  opacity: 0.75;
  user-select: none;
}

.raw table {
  width: 100%;
  margin-top: 8px;
  border-collapse: collapse;
  font-size: 12px;
  font-family: var(--base-code-font-family, monospace);
}

.raw th,
.raw td {
  text-align: left;
  padding: 3px 6px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: top;
}

.raw th {
  white-space: nowrap;
  font-weight: normal;
  opacity: 0.7;
}

.pending {
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
}
</style>
