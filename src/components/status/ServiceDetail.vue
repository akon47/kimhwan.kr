<template>
  <div class="backdrop" @click.self="emit('close')">
    <div class="panel" role="dialog" aria-modal="true" :aria-label="service.name">
      <div class="head">
        <span class="icon">{{ service.icon }}</span>
        <div class="titles">
          <div class="name">{{ service.name }}</div>
          <div class="desc">{{ service.description }}</div>
        </div>
        <span class="health" :class="service.health">{{ healthLabel(service.health) }}</span>
        <button class="close" aria-label="닫기" @click="emit('close')">✕</button>
      </div>

      <div class="links">
        <a v-if="service.url" :href="service.url" target="_blank" rel="noopener" class="btn primary">열기 ↗</a>
        <a v-for="r in service.repos" :key="r" :href="r" target="_blank" rel="noopener" class="btn">{{ repoLabel(r) }}</a>
      </div>

      <div class="grid">
        <div class="stat">
          <div class="label">가동률 24h</div>
          <div class="value">{{ pctText(stats?.uptime24hPct) }}</div>
        </div>
        <div class="stat">
          <div class="label">가동률 30d</div>
          <div class="value">{{ pctText(stats?.uptime30dPct) }}</div>
        </div>
        <div class="stat">
          <div class="label">응답 (지금 / 24h 평균)</div>
          <div class="value">{{ service.latencyMs ?? '–' }} <small>ms</small> / {{ stats?.avgLatency24hMs ?? '–' }} <small>ms</small></div>
        </div>
        <div class="stat">
          <div class="label">최근 {{ windowMinutes }}분 트래픽</div>
          <div class="value small">{{ traffic ? `${fmtRate(traffic.rpm)} · ↑${fmtBps(traffic.bpsOut)} ↓${fmtBps(traffic.bpsIn)}` : '–' }}</div>
        </div>
      </div>

      <div v-if="stats && stats.latency24h.some((v) => v !== null)" class="spark">
        <div class="label">응답 시간 24h (ms)</div>
        <SparkLine :values="stats.latency24h" :width="440" :height="48"/>
      </div>

      <div class="checks">
        <div class="label">점검 항목</div>
        <div v-for="c in service.checks" :key="c.name" class="check" :class="{ ok: c.ok }">
          <span class="mark">{{ c.ok ? '✓' : '✗' }}</span>
          <span class="cname">{{ c.name }}</span>
          <span class="cmeta">
            <template v-if="c.status">HTTP {{ c.status }} · </template>{{ c.ms }} ms<template v-if="c.error"> · {{ c.error }}</template>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import SparkLine from '@/components/status/SparkLine.vue';
import type { Health, ServiceStats, ServiceStatus } from '@/types/status';

defineProps<{
  service: ServiceStatus;
  stats?: ServiceStats;
  traffic?: { rpm: number; bpsOut: number; bpsIn: number };
  windowMinutes: number;
}>();

const emit = defineEmits<{ close: [] }>();

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close');
  }
}

onMounted(() => document.addEventListener('keydown', onKey));
onUnmounted(() => document.removeEventListener('keydown', onKey));

function healthLabel(h: Health): string {
  return { up: '정상', degraded: '일부 문제', down: '중단' }[h];
}

function pctText(v: number | null | undefined): string {
  return v === null || v === undefined ? '–' : `${v.toFixed(v >= 99.95 ? 0 : 1)}%`;
}

function repoLabel(url: string): string {
  return url.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
}

function fmtRate(r: number): string {
  return r >= 10 ? `${r.toFixed(0)}/min` : `${r.toFixed(1)}/min`;
}

function fmtBps(b: number): string {
  return b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB/s` : b >= 1024 ? `${(b / 1024).toFixed(0)} KB/s` : `${b.toFixed(0)} B/s`;
}
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 50;
}

.panel {
  width: min(520px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: var(--content-background-color);
  color: var(--base-color);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: grid;
  row-gap: 16px;
}

.head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon {
  font-size: 28px;
}

.titles {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 18px;
  font-weight: bold;
}

.desc {
  font-size: 13px;
  opacity: 0.7;
}

.health {
  font-size: 12px;
  font-weight: bold;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--menu-hover-color);
}

.health.up { color: #2ea043; }
.health.degraded { color: #d29922; }
.health.down { color: #f85149; }

.close {
  padding: 4px 10px;
  font-size: 14px;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn {
  font-size: 12px;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
}

.btn:hover {
  background: var(--menu-hover-color);
  text-decoration: none;
}

.btn.primary {
  border-color: var(--link-accent-color);
  color: var(--link-accent-color);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
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
  font-size: 18px;
  font-weight: bold;
}

.value.small {
  font-size: 13px;
}

.value small {
  font-size: 11px;
  font-weight: normal;
  opacity: 0.7;
}

.spark {
  display: grid;
  row-gap: 4px;
}

.checks {
  display: grid;
  row-gap: 6px;
}

.check {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(248, 81, 73, 0.1);
}

.check.ok {
  background: var(--menu-hover-color);
}

.mark {
  color: #f85149;
  font-weight: bold;
}

.check.ok .mark {
  color: #2ea043;
}

.cname {
  font-weight: bold;
}

.cmeta {
  opacity: 0.7;
  font-size: 12px;
  margin-left: auto;
  text-align: right;
}
</style>
