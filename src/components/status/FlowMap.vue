<template>
  <div class="flow-map">
    <svg :viewBox="`0 0 ${W} ${H}`" class="flow-svg" role="img" aria-label="트래픽 흐름도">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/>
        </marker>
      </defs>

      <!-- home boundary -->
      <rect :x="HOME.x" :y="HOME.y" :width="HOME.w" :height="HOME.h" rx="16" class="home-box"/>
      <text :x="HOME.x + 16" :y="HOME.y + 24" class="home-label">🏠 집 서버 (Proxmox · 내부망 10.10.10.0/24)</text>
      <text :x="COL_APPS.x" :y="COL_APPS.labelY" class="col-label">서비스</text>
      <text :x="COL_PLATFORM.x" :y="COL_PLATFORM.labelY" class="col-label">인프라</text>

      <!-- edges -->
      <g class="edges">
        <path
          v-for="e in edges"
          :key="e.id"
          :d="e.d"
          class="edge"
          :class="[e.kind, { active: e.active, dead: e.dead }]"
          :style="{ strokeWidth: e.width, animationDuration: e.duration }"
          marker-end="url(#arrow)"
        >
          <title>{{ e.title }}</title>
        </path>
      </g>

      <!-- nodes -->
      <g v-for="n in nodes" :key="n.id" class="node" :class="n.health">
        <a v-if="n.url" :href="n.url" target="_blank" rel="noopener">
          <rect :x="n.x" :y="n.y" :width="n.w" :height="n.h" rx="10" class="node-box"/>
        </a>
        <rect v-else :x="n.x" :y="n.y" :width="n.w" :height="n.h" rx="10" class="node-box"/>
        <circle v-if="n.health !== 'none'" :cx="n.x + 14" :cy="n.y + n.h / 2" r="4.5" class="node-dot"/>
        <text :x="n.x + (n.health !== 'none' ? 26 : 12)" :y="n.y + n.h / 2 + (n.sub ? -3 : 5)" class="node-title">
          {{ n.icon }} {{ n.label }}
        </text>
        <text v-if="n.sub" :x="n.x + (n.health !== 'none' ? 26 : 12)" :y="n.y + n.h / 2 + 12" class="node-sub">{{ n.sub }}</text>
        <title>{{ n.title }}</title>
      </g>
    </svg>

    <div class="legend">
      <span><i class="sw traffic"/>트래픽 (굵기·속도 = 최근 {{ windowMinutes }}분 요청량)</span>
      <span><i class="sw power"/>전원</span>
      <span><i class="sw deploy"/>배포 (GitHub → Jenkins → Docker Hub → VM)</span>
      <span><i class="sw logs"/>접속 로그</span>
      <span><i class="sw dead"/>끊김</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Health, ServiceStatus, StatusSnapshot } from '@/types/status';

const props = defineProps<{ data: StatusSnapshot }>();

const W = 1060;
const H = 660;
const HOME = { x: 340, y: 20, w: 705, h: 625 };
const COL_APPS = { x: 640, w: 172, top: 128, step: 56, labelY: 118 };
const COL_PLATFORM = { x: 858, w: 172, top: 128, step: 56, labelY: 118 };

type NodeHealth = Health | 'none' | 'off';

interface FlowNode {
  id: string;
  label: string;
  icon: string;
  sub?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  health: NodeHealth;
  url?: string;
  title: string;
}

interface FlowEdge {
  id: string;
  d: string;
  kind: 'traffic' | 'power' | 'deploy' | 'logs';
  active: boolean;
  dead: boolean;
  width: number;
  duration: string;
  title: string;
}

const windowMinutes = computed(() => props.data.traffic?.windowMinutes ?? 5);

function rpm(id: string): number {
  const t = props.data.traffic;
  if (!t) {
    return 0;
  }
  return (t.byService[id] ?? 0) / t.windowMinutes;
}

function byId(id: string): ServiceStatus | undefined {
  return props.data.services.find((s) => s.id === id);
}

function healthOf(id: string): NodeHealth {
  return byId(id)?.health ?? 'none';
}

const nodes = computed<FlowNode[]>(() => {
  const d = props.data;
  const out: FlowNode[] = [];
  const t = d.traffic;
  const total = t ? Math.round(t.total / t.windowMinutes) : null;

  out.push({ id: 'visitor', label: '방문자', icon: '🌍', sub: total !== null ? `${total} req/min` : undefined, x: 20, y: 306, w: 130, h: 48, health: 'none', title: '인터넷에서 오는 요청' });
  out.push({ id: 'cloudflare', label: 'Cloudflare', icon: '☁️', sub: '프록시 · 점검 페이지 · Access', x: 176, y: 306, w: 146, h: 48, health: 'none', url: 'https://www.cloudflare.com/', title: 'DNS·프록시·정전 시 점검 페이지(Worker)·Kibana 앞 Access' });
  out.push({ id: 'github', label: 'GitHub', icon: '🐙', sub: 'push → webhook', x: 20, y: 586, w: 130, h: 48, health: 'none', url: 'https://github.com/akon47', title: '소스 저장소' });
  out.push({ id: 'dockerhub', label: 'Docker Hub', icon: '🐳', sub: 'akon47/*', x: 176, y: 586, w: 146, h: 48, health: 'none', url: 'https://hub.docker.com/u/akon47', title: '빌드된 이미지 저장소' });

  const ups = d.ups;
  out.push({ id: 'power', label: '전원', icon: '🔌', sub: ups?.lineVolts ? `${ups.lineVolts.toFixed(0)} V` : undefined, x: 360, y: 50, w: 96, h: 44, health: ups ? (ups.onBattery ? 'down' : 'up') : 'none', title: '상용 전원' });
  out.push({
    id: 'ups', label: 'UPS', icon: '🔋',
    sub: ups ? `${ups.chargePct?.toFixed(0) ?? '–'}% · ${ups.runtimeMin?.toFixed(0) ?? '–'}분 · 부하 ${ups.loadPct?.toFixed(0) ?? '–'}%` : '연결 안 됨',
    x: 480, y: 50, w: 140, h: 44, health: ups ? (ups.onBattery ? 'degraded' : 'up') : 'none',
    title: ups ? `${ups.model} · ${ups.status}` : 'UPS 상태를 읽지 못함',
  });
  const host = d.host;
  out.push({
    id: 'host', label: 'Proxmox 호스트', icon: '🧱',
    sub: host ? `CPU ${host.cpuPct.toFixed(0)}% · RAM ${(host.mem.used / 1024 ** 3).toFixed(0)}/${(host.mem.total / 1024 ** 3).toFixed(0)} GB · ${d.guests.filter((g) => g.status === 'running').length}개 실행` : undefined,
    x: 644, y: 50, w: 386, h: 44, health: host ? 'up' : 'none', url: 'https://ve.kimhwan.kr/', title: host ? `${host.pveVersion} · 가동 ${Math.floor(host.uptimeSec / 86400)}일` : '',
  });

  const gw = byId('gateway');
  out.push({ id: 'gateway', label: 'nginx 관문', icon: '🚪', sub: gw?.latencyMs !== null && gw?.latencyMs !== undefined ? `TLS 종료 · ${gw.latencyMs} ms` : 'TLS 종료', x: 420, y: 306, w: 150, h: 48, health: healthOf('gateway'), title: '모든 공개 도메인이 지나는 관문 (LXC 101)' });

  const place = (ids: string[], col: typeof COL_APPS) => {
    ids.forEach((id, i) => {
      const s = byId(id);
      if (!s) {
        return;
      }
      const r = rpm(id);
      const sub = r > 0 ? `${r.toFixed(r < 10 ? 1 : 0)} req/min` : s.latencyMs !== null ? `${s.latencyMs} ms` : undefined;
      out.push({ id, label: s.name, icon: s.icon, sub, x: col.x, y: col.top + i * col.step, w: col.w, h: 44, health: s.health, url: s.url, title: `${s.description} · ${labelOf(s.health)}` });
    });
  };
  place(APP_ORDER.filter((id) => byId(id)), COL_APPS);
  place(PLATFORM_ORDER.filter((id) => byId(id)), COL_PLATFORM);
  return out;
});

const APP_ORDER = ['homepage', 'hwanstory', 'hwanscord', 'shootgame', 'screenshare', 'funcia', 'visit-counter', 'n8n'];
const PLATFORM_ORDER = ['jenkins', 'elk', 'mail', 'nas', 'vpn', 'proxmox'];
const DIRECT = new Set(['nas', 'proxmox', 'mail', 'vpn']);

function nodeById(list: FlowNode[], id: string): FlowNode | undefined {
  return list.find((n) => n.id === id);
}

function curve(a: FlowNode, b: FlowNode, from: 'right' | 'bottom' | 'top' = 'right', to: 'left' | 'top' | 'bottom' = 'left'): string {
  const ax = from === 'right' ? a.x + a.w : a.x + a.w / 2;
  const ay = from === 'right' ? a.y + a.h / 2 : from === 'bottom' ? a.y + a.h : a.y;
  const bx = to === 'left' ? b.x : b.x + b.w / 2;
  const by = to === 'left' ? b.y + b.h / 2 : to === 'top' ? b.y : b.y + b.h;
  if (from === 'right' && to === 'left') {
    const mx = (ax + bx) / 2;
    return `M ${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`;
  }
  const my = (ay + by) / 2;
  return `M ${ax} ${ay} C ${ax} ${my}, ${bx} ${my}, ${bx} ${by}`;
}

function widthFor(r: number): number {
  return Math.min(1.6 + Math.log10(r + 1) * 1.6, 6);
}

function durationFor(r: number): string {
  return `${Math.max(0.35, 2.2 - Math.min(r, 120) / 70).toFixed(2)}s`;
}

const edges = computed<FlowEdge[]>(() => {
  const ns = nodes.value;
  const d = props.data;
  const out: FlowEdge[] = [];
  const n = (id: string) => nodeById(ns, id);
  const visitor = n('visitor');
  const cf = n('cloudflare');
  const gw = n('gateway');
  const gwUp = healthOf('gateway') === 'up';
  if (!visitor || !cf || !gw) {
    return out;
  }

  // traffic: visitor -> cloudflare -> gateway, plus the direct (DNS-only) path
  let proxied = 0;
  let direct = 0;
  for (const s of d.services) {
    const r = rpm(s.id);
    if (DIRECT.has(s.id)) {
      direct += r;
    } else {
      proxied += r;
    }
  }
  out.push({ id: 'v-cf', d: curve(visitor, cf), kind: 'traffic', active: proxied > 0, dead: false, width: widthFor(proxied), duration: durationFor(proxied), title: `프록시 경유 ${proxied.toFixed(0)} req/min` });
  out.push({ id: 'cf-gw', d: curve(cf, gw), kind: 'traffic', active: proxied > 0 && gwUp, dead: !gwUp, width: widthFor(proxied), duration: durationFor(proxied), title: `Cloudflare → 관문 ${proxied.toFixed(0)} req/min` });
  out.push({ id: 'v-gw', d: `M ${visitor.x + visitor.w / 2} ${visitor.y} C ${visitor.x + visitor.w / 2} 230, ${gw.x + 30} 230, ${gw.x + 30} ${gw.y}`, kind: 'traffic', active: direct > 0 && gwUp, dead: !gwUp, width: widthFor(direct), duration: durationFor(direct), title: `직결(Cloudflare 안 거침: NAS·Proxmox·메일·VPN) ${direct.toFixed(0)} req/min` });

  // gateway -> each service
  for (const s of d.services) {
    const target = n(s.id);
    if (!target || s.id === 'gateway') {
      continue;
    }
    const r = rpm(s.id);
    const dead = s.health === 'down' || !gwUp;
    out.push({ id: `gw-${s.id}`, d: curve(gw, target), kind: 'traffic', active: r > 0 && !dead, dead, width: widthFor(r), duration: durationFor(r), title: `${s.name}: ${r > 0 ? `${r.toFixed(1)} req/min` : '최근 요청 없음'}` });
  }

  // power: 전원 -> UPS -> 호스트
  const power = n('power');
  const ups = n('ups');
  const host = n('host');
  if (power && ups && host) {
    const onBattery = d.ups?.onBattery ?? false;
    out.push({ id: 'p-ups', d: curve(power, ups), kind: 'power', active: !!d.ups && !onBattery, dead: onBattery, width: 2.5, duration: '1.2s', title: onBattery ? '정전: 상용 전원 끊김' : '상용 전원 정상' });
    out.push({ id: 'ups-host', d: curve(ups, host), kind: 'power', active: !!d.ups, dead: false, width: 2.5, duration: onBattery ? '0.5s' : '1.2s', title: onBattery ? '배터리로 호스트에 전원 공급 중' : 'UPS 경유 전원 공급' });
  }

  // deploy: GitHub -> Jenkins -> Docker Hub -> services (one representative line into the apps column)
  const gh = n('github');
  const dh = n('dockerhub');
  const jenkins = n('jenkins');
  if (gh && dh && jenkins) {
    const jUp = healthOf('jenkins') === 'up';
    out.push({ id: 'gh-j', d: `M ${gh.x + gh.w} ${gh.y + gh.h / 2 - 8} C 300 ${gh.y - 60}, ${jenkins.x - 40} ${jenkins.y + jenkins.h / 2 + 90}, ${jenkins.x} ${jenkins.y + jenkins.h / 2}`, kind: 'deploy', active: jUp, dead: !jUp, width: 1.6, duration: '2.4s', title: 'GitHub push → Jenkins 웹훅' });
    out.push({ id: 'j-dh', d: `M ${jenkins.x} ${jenkins.y + jenkins.h - 6} C ${jenkins.x - 60} 420, ${dh.x + dh.w + 80} ${dh.y - 60}, ${dh.x + dh.w} ${dh.y + dh.h / 2 - 8}`, kind: 'deploy', active: jUp, dead: !jUp, width: 1.6, duration: '2.4s', title: 'Jenkins → Docker Hub 이미지 푸시' });
    out.push({ id: 'dh-apps', d: `M ${dh.x + dh.w} ${dh.y + dh.h / 2 + 8} C 400 ${dh.y + 40}, ${COL_APPS.x - 60} ${COL_APPS.top + 8 * COL_APPS.step + 10}, ${COL_APPS.x} ${COL_APPS.top + 7 * COL_APPS.step + 30}`, kind: 'deploy', active: jUp, dead: false, width: 1.6, duration: '2.4s', title: 'VM 이 Docker Hub 에서 이미지를 받아 compose 로 배포' });
  }

  // logs: gateway -> ELK
  const elk = n('elk');
  if (elk) {
    const elkUp = healthOf('elk') === 'up';
    out.push({ id: 'gw-elk', d: `M ${gw.x + gw.w / 2} ${gw.y + gw.h} C ${gw.x + gw.w / 2} 520, ${elk.x + elk.w / 2} 520, ${elk.x + elk.w / 2} ${elk.y + elk.h}`, kind: 'logs', active: elkUp && gwUp, dead: !elkUp, width: 1.6, duration: '2s', title: 'filebeat → Logstash → Elasticsearch → Kibana' });
  }
  return out;
});

function labelOf(h: Health): string {
  return { up: '정상', degraded: '일부 문제', down: '중단' }[h];
}
</script>

<style scoped>
.flow-map {
  width: 100%;
  overflow-x: auto;
}

.flow-svg {
  width: 100%;
  min-width: 760px;
  height: auto;
  display: block;
  font-family: var(--base-font-family);
}

.home-box {
  fill: var(--menu-hover-color);
  fill-opacity: 0.35;
  stroke: var(--border-color);
  stroke-width: 1.5;
  stroke-dasharray: 6 5;
}

.home-label {
  font-size: 13px;
  font-weight: bold;
  fill: var(--base-color);
  opacity: 0.8;
}

.col-label {
  font-size: 11px;
  fill: var(--base-color);
  opacity: 0.55;
  letter-spacing: 0.08em;
}

/* edges */
.edge {
  fill: none;
  stroke-linecap: round;
  opacity: 0.35;
  transition: opacity 0.3s;
}

.edge.traffic { stroke: var(--link-accent-color); }
.edge.power { stroke: #2ea043; }
.edge.deploy { stroke: #1abc9c; stroke-dasharray: 4 6; }
.edge.logs { stroke: #a371f7; stroke-dasharray: 2 6; }

.edge.active {
  opacity: 0.9;
  stroke-dasharray: 7 9;
  animation: flow linear infinite;
}

.edge.deploy.active { stroke-dasharray: 4 8; }
.edge.logs.active { stroke-dasharray: 2 7; }
.edge.power.active { stroke-dasharray: 10 8; }

.edge.dead {
  stroke: #f85149;
  stroke-dasharray: 3 5;
  opacity: 0.6;
  animation: none;
}

.edge:hover {
  opacity: 1;
}

@keyframes flow {
  to {
    stroke-dashoffset: -32;
  }
}

/* nodes */
.node-box {
  fill: var(--content-background-color);
  stroke: var(--border-color);
  stroke-width: 1.5;
  transition: stroke 0.2s;
}

.node.up .node-box { stroke: rgba(46, 160, 67, 0.7); }
.node.degraded .node-box { stroke: rgba(210, 153, 34, 0.8); }
.node.down .node-box { stroke: rgba(248, 81, 73, 0.85); stroke-width: 2; }
.node:hover .node-box { stroke: var(--link-accent-color); }

.node-dot { fill: #8b949e; }
.node.up .node-dot { fill: #2ea043; }
.node.degraded .node-dot { fill: #d29922; }
.node.down .node-dot { fill: #f85149; }

.node-title {
  font-size: 13px;
  font-weight: bold;
  fill: var(--base-color);
}

.node-sub {
  font-size: 10.5px;
  fill: var(--base-color);
  opacity: 0.65;
}

.node a { cursor: pointer; }

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  font-size: 12px;
  opacity: 0.8;
  margin-top: 8px;
}

.sw {
  display: inline-block;
  width: 22px;
  height: 0;
  border-top: 3px solid;
  margin-right: 6px;
  vertical-align: middle;
}

.sw.traffic { border-color: var(--link-accent-color); }
.sw.power { border-color: #2ea043; }
.sw.deploy { border-color: #1abc9c; border-top-style: dashed; }
.sw.logs { border-color: #a371f7; border-top-style: dotted; }
.sw.dead { border-color: #f85149; border-top-style: dashed; }

@media (prefers-reduced-motion: reduce) {
  .edge.active { animation: none; }
}
</style>
