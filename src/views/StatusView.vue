<template>
  <div class="status-view">
    <!-- overall -->
    <section class="overall" :class="overallClass">
      <div class="overall-main">
        <span class="dot big" :class="overallClass"/>
        <div>
          <div class="overall-title">{{ overallTitle }}</div>
          <div class="overall-sub">
            <template v-if="data">
              {{ data.summary.up }} 정상
              <template v-if="data.summary.degraded"> · {{ data.summary.degraded }} 일부 문제</template>
              <template v-if="data.summary.down"> · {{ data.summary.down }} 중단</template>
              · 집 서버 내부망에서 직접 점검
            </template>
            <template v-else-if="error">상태 API 에 연결할 수 없습니다 ({{ error }})</template>
            <template v-else>불러오는 중…</template>
          </div>
        </div>
      </div>
      <div class="overall-meta">
        <span v-if="lastUpdated">{{ formatClock(lastUpdated) }} 기준 · 20초마다 갱신</span>
        <button :disabled="loading" @click="refresh">새로고침</button>
      </div>
    </section>

    <!-- flow map -->
    <section v-if="data" class="block">
      <h4 class="block-title">🔀 흐름도 <small>트래픽 · 전원 · 배포 · 로그가 지금 어디로 흐르는지</small></h4>
      <FlowMap :data="data"/>
    </section>

    <!-- host -->
    <section v-if="data?.host" class="block">
      <h4 class="block-title">🧱 Proxmox 호스트</h4>
      <div class="tiles">
        <div class="tile">
          <div class="tile-label">CPU</div>
          <div class="tile-value">{{ data.host.cpuPct.toFixed(1) }}<small>%</small></div>
          <div class="bar"><span :style="barStyle(data.host.cpuPct)"/></div>
          <div class="tile-note">{{ data.host.cpuCount }} threads · load {{ data.host.load1.toFixed(2) }}</div>
        </div>
        <div class="tile">
          <div class="tile-label">메모리</div>
          <div class="tile-value">{{ pct(data.host.mem.used, data.host.mem.total) }}<small>%</small></div>
          <div class="bar"><span :style="barStyle(pct(data.host.mem.used, data.host.mem.total))"/></div>
          <div class="tile-note">
            {{ gb(data.host.mem.used) }} / {{ gb(data.host.mem.total) }} GB
            <template v-if="data.host.swap.used > 0"> · swap {{ gb(data.host.swap.used) }} GB</template>
          </div>
        </div>
        <div v-for="s in mainStorages" :key="s.name" class="tile">
          <div class="tile-label">{{ storageLabel(s.name) }}</div>
          <div class="tile-value">{{ pct(s.used, s.total) }}<small>%</small></div>
          <div class="bar"><span :style="barStyle(pct(s.used, s.total))"/></div>
          <div class="tile-note">{{ gb(s.used) }} / {{ gb(s.total) }} GB</div>
        </div>
        <div class="tile">
          <div class="tile-label">가동</div>
          <div class="tile-value">{{ uptimeShort(data.host.uptimeSec) }}</div>
          <div class="tile-note">{{ data.host.pveVersion.replace('pve-manager/', 'PVE ').split('/')[0] }} · {{ data.host.kernel }}</div>
        </div>
        <div v-if="data.ups" class="tile" :class="{ warn: data.ups.onBattery }">
          <div class="tile-label">🔋 UPS</div>
          <div class="tile-value">{{ data.ups.chargePct?.toFixed(0) ?? '–' }}<small>%</small></div>
          <div class="bar"><span :style="barStyle(data.ups.chargePct ?? 0, true)"/></div>
          <div class="tile-note">
            {{ data.ups.onBattery ? '⚡ 배터리 사용 중' : '전원 정상' }} · 부하 {{ data.ups.loadPct?.toFixed(0) ?? '–' }}% ·
            {{ data.ups.runtimeMin?.toFixed(0) ?? '–' }}분 버팀
          </div>
        </div>
        <div v-if="data.backup" class="tile" :class="{ warn: data.backup.status !== 'OK' }">
          <div class="tile-label">💾 마지막 백업</div>
          <div class="tile-value small">{{ data.backup.status === 'OK' ? '성공' : data.backup.status }}</div>
          <div class="tile-note">
            {{ formatDate(data.backup.startedAt) }}
            <template v-if="data.backup.durationSec !== null"> · {{ Math.round(data.backup.durationSec / 60) }}분 소요</template>
          </div>
        </div>
      </div>
      <div v-if="data.disks.length" class="chips">
        <span v-for="d in data.disks" :key="d.device" class="chip" :class="{ bad: d.health !== 'PASSED' && d.health !== 'OK' }">
          {{ d.type === 'nvme' || d.type === 'ssd' ? '⚡' : '💿' }} {{ d.model }} · {{ (d.sizeBytes / 1e12).toFixed(1) }} TB ·
          {{ d.health }}<template v-if="d.wearPct !== null"> · 수명 {{ d.wearPct }}% 사용</template>
          <template v-if="d.tempC !== null"> · {{ d.tempC }}℃</template>
        </span>
      </div>
    </section>

    <!-- services -->
    <section v-for="group in groups" :key="group.key" class="block">
      <h4 class="block-title">{{ group.title }}</h4>
      <div class="cards">
        <a
          v-for="s in group.items"
          :key="s.id"
          class="card"
          :class="s.health"
          :href="s.url"
          :target="s.url ? '_blank' : undefined"
          :rel="s.url ? 'noopener' : undefined"
        >
          <div class="card-head">
            <span class="card-icon">{{ s.icon }}</span>
            <span class="card-name">{{ s.name }}</span>
            <span class="dot" :class="s.health"/>
          </div>
          <div class="card-desc">{{ s.description }}</div>
          <div class="card-foot">
            <span class="health-label" :class="s.health">{{ healthLabel(s.health) }}</span>
            <span v-if="s.latencyMs !== null" class="latency">{{ s.latencyMs }} ms</span>
            <span class="checks">
              <span v-for="c in s.checks" :key="c.name" class="check" :class="{ ok: c.ok }" :title="checkTitle(c)">
                {{ c.ok ? '✓' : '✗' }} {{ c.name }}
              </span>
            </span>
          </div>
        </a>
      </div>
    </section>

    <!-- guests -->
    <section v-if="data?.guests.length" class="block">
      <h4 class="block-title">📦 가상 머신 · 컨테이너 <small>{{ runningGuests }} / {{ data.guests.length }} 실행 중</small></h4>
      <div class="guests">
        <div v-for="g in data.guests" :key="g.vmid" class="guest" :class="g.status">
          <div class="guest-head">
            <span class="dot" :class="g.status === 'running' ? 'up' : 'off'"/>
            <span class="guest-name">{{ g.name }}</span>
            <span class="guest-type">{{ g.type === 'qemu' ? 'VM' : 'LXC' }}</span>
            <span class="guest-id">#{{ g.vmid }}</span>
          </div>
          <div v-if="g.status === 'running'" class="guest-metrics">
            <span class="metric">
              <span class="metric-label">CPU</span>
              <span class="mini-bar"><span :style="barStyle(g.cpuPct)"/></span>
              <span class="metric-value">{{ g.cpuPct.toFixed(1) }}%</span>
            </span>
            <span class="metric">
              <span class="metric-label">RAM</span>
              <span class="mini-bar"><span :style="barStyle(pct(g.mem, g.maxmem))"/></span>
              <span class="metric-value">{{ gb(g.mem) }} / {{ gb(g.maxmem) }} GB</span>
            </span>
            <span class="metric uptime">⏱ {{ uptimeShort(g.uptimeSec) }}</span>
          </div>
          <div v-else class="guest-metrics">
            <span class="metric">정지됨</span>
          </div>
        </div>
      </div>
    </section>

    <p v-if="data?.errors.length" class="errors">
      일부 항목을 읽지 못했습니다: {{ data.errors.join(' · ') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FlowMap from '@/components/status/FlowMap.vue';
import { useStatus } from '@/composables/useStatus';
import type { CheckResult, Health, ServiceStatus } from '@/types/status';

const { data, error, loading, lastUpdated, refresh } = useStatus();

const overallClass = computed<Health | 'unknown'>(() => (data.value ? data.value.overall : error.value ? 'down' : 'unknown'));

const overallTitle = computed(() => {
  if (!data.value) {
    return error.value ? '상태를 확인할 수 없습니다' : '상태 확인 중';
  }
  return { up: '모든 서비스가 정상입니다', degraded: '일부 서비스에 문제가 있습니다', down: '서비스가 중단됐습니다' }[data.value.overall];
});

const groups = computed(() => {
  const items = data.value?.services ?? [];
  const by = (c: ServiceStatus['category']) => items.filter((s) => s.category === c);
  return [
    { key: 'apps', title: '🚀 서비스', items: by('apps') },
    { key: 'platform', title: '🛠 인프라', items: by('platform') },
  ].filter((g) => g.items.length);
});

const mainStorages = computed(() => (data.value?.storages ?? []).filter((s) => s.name === 'local-lvm' || s.name === 'local-hdd'));
const runningGuests = computed(() => (data.value?.guests ?? []).filter((g) => g.status === 'running').length);

function pct(used: number, total: number): number {
  return total > 0 ? Math.round((used / total) * 100) : 0;
}

function gb(bytes: number): string {
  return (bytes / 1024 ** 3).toFixed(bytes >= 100 * 1024 ** 3 ? 0 : 1);
}

function barStyle(value: number, invert = false) {
  const v = Math.max(0, Math.min(100, value));
  const level = invert ? 100 - v : v;
  const color = level >= 90 ? '#f85149' : level >= 75 ? '#d29922' : '#2ea043';
  return { width: `${v}%`, background: color };
}

function storageLabel(name: string): string {
  return name === 'local-lvm' ? 'VM 디스크 (SSD)' : name === 'local-hdd' ? '백업·데이터 (HDD)' : name;
}

function uptimeShort(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d > 0 ? `${d}일 ${h}시간` : h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

function formatClock(date: Date): string {
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function healthLabel(h: Health): string {
  return { up: '정상', degraded: '일부 문제', down: '중단' }[h];
}

function checkTitle(c: CheckResult): string {
  const parts = [c.name, c.ok ? '정상' : '실패'];
  if (c.status) {
    parts.push(`HTTP ${c.status}`);
  }
  if (c.error) {
    parts.push(c.error);
  }
  parts.push(`${c.ms} ms`);
  return parts.join(' · ');
}
</script>

<style scoped>
.status-view {
  width: 100%;
  display: grid;
  row-gap: 24px;
}

/* ----- overall banner ----- */
.overall {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 18px 20px;
  border: 1px solid var(--border-color);
  border-left: 5px solid #2ea043;
  border-radius: 8px;
}

.overall.degraded { border-left-color: #d29922; }
.overall.down { border-left-color: #f85149; }
.overall.unknown { border-left-color: var(--border-color); }

.overall-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.overall-title {
  font-size: 20px;
  font-weight: bold;
}

.overall-sub {
  font-size: 13px;
  opacity: 0.75;
  margin-top: 2px;
}

.overall-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  opacity: 0.8;
}

.overall-meta button {
  padding: 6px 14px;
  font-size: 12px;
}

/* ----- status dots ----- */
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #8b949e;
  flex-shrink: 0;
}

.dot.big {
  width: 18px;
  height: 18px;
}

.dot.up { background: #2ea043; box-shadow: 0 0 0 4px rgba(46, 160, 67, 0.18); }
.dot.degraded { background: #d29922; box-shadow: 0 0 0 4px rgba(210, 153, 34, 0.2); }
.dot.down { background: #f85149; box-shadow: 0 0 0 4px rgba(248, 81, 73, 0.2); animation: pulse 1.6s ease-in-out infinite; }
.dot.off { background: #8b949e; opacity: 0.5; }

@keyframes pulse {
  50% { box-shadow: 0 0 0 8px rgba(248, 81, 73, 0.05); }
}

/* ----- sections ----- */
.block-title {
  margin: 0 0 12px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.block-title small {
  font-size: 12px;
  font-weight: normal;
  opacity: 0.7;
}

/* ----- host tiles ----- */
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
}

.tile {
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  display: grid;
  row-gap: 6px;
  align-content: start;
}

.tile.warn {
  border-color: #d29922;
}

.tile-label {
  font-size: 12px;
  opacity: 0.7;
  letter-spacing: 0.02em;
}

.tile-value {
  font-size: 26px;
  font-weight: bold;
  line-height: 1.1;
}

.tile-value.small {
  font-size: 20px;
}

.tile-value small {
  font-size: 14px;
  font-weight: normal;
  margin-left: 2px;
  opacity: 0.7;
}

.tile-note {
  font-size: 12px;
  opacity: 0.7;
}

.bar {
  height: 6px;
  border-radius: 3px;
  background: var(--menu-hover-color);
  overflow: hidden;
}

.bar > span {
  display: block;
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.chip {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  opacity: 0.9;
}

.chip.bad {
  border-color: #f85149;
}

/* ----- service cards ----- */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}

.card {
  display: grid;
  row-gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.card:hover {
  text-decoration: none;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--base-shadow-color);
  border-color: var(--link-accent-color);
}

.card.down { border-color: rgba(248, 81, 73, 0.6); }
.card.degraded { border-color: rgba(210, 153, 34, 0.6); }

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-icon {
  font-size: 18px;
}

.card-name {
  font-weight: bold;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  font-size: 13px;
  opacity: 0.75;
  min-height: 2.6em;
}

.card-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  font-size: 12px;
}

.health-label {
  font-weight: bold;
}

.health-label.up { color: #2ea043; }
.health-label.degraded { color: #d29922; }
.health-label.down { color: #f85149; }

.latency {
  opacity: 0.7;
}

.checks {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.check {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(248, 81, 73, 0.15);
  color: #f85149;
}

.check.ok {
  background: var(--menu-hover-color);
  color: inherit;
  opacity: 0.75;
}

/* ----- guests ----- */
.guests {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}

.guest {
  display: grid;
  row-gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  min-width: 0;
}

.guest.stopped {
  opacity: 0.55;
}

.guest-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.guest-name {
  font-weight: bold;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.guest-type {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--menu-hover-color);
  flex-shrink: 0;
}

.guest-id {
  margin-left: auto;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11px;
  opacity: 0.5;
  flex-shrink: 0;
}

.guest-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 12px;
  opacity: 0.85;
}

.metric {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.metric-label {
  font-size: 10.5px;
  opacity: 0.6;
  letter-spacing: 0.04em;
}

.mini-bar {
  display: inline-block;
  width: 46px;
  height: 5px;
  border-radius: 3px;
  background: var(--menu-hover-color);
  overflow: hidden;
}

.mini-bar > span {
  display: block;
  height: 100%;
  border-radius: 3px;
}

.metric.uptime {
  opacity: 0.7;
}

.errors {
  font-size: 12px;
  opacity: 0.7;
}

@media (max-width: 720px) {
  .checks {
    margin-left: 0;
  }
}
</style>
