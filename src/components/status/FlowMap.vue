<template>
  <div ref="wrap" class="flow-map">
    <div class="toggles">
      <label><input v-model="show.traffic" type="checkbox"/><i class="sw traffic"/>트래픽</label>
      <label><input v-model="show.power" type="checkbox"/><i class="sw power"/>전원</label>
      <label v-if="!narrow"><input v-model="show.deploy" type="checkbox"/><i class="sw deploy"/>배포 (GitHub → Jenkins → Docker Hub → VM)</label>
      <label v-if="!narrow"><input v-model="show.logs" type="checkbox"/><i class="sw logs"/>접속 로그 → ELK</label>
      <span class="hint">숫자 = 최근 {{ windowMinutes }}분 평균 요청/분 · ↑송신 ↓수신. 노드를 누르면 자세히 봅니다.</span>
    </div>

    <svg :viewBox="`0 0 ${L.w} ${L.h}`" class="flow-svg" :class="{ narrow }" role="img" aria-label="트래픽 흐름도">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/>
        </marker>
      </defs>

      <rect :x="L.home.x" :y="L.home.y" :width="L.home.w" :height="L.home.h" rx="18" class="home-box"/>
      <text :x="L.home.x + 20" :y="L.home.y + 32" class="home-label">🏠 집 서버 · Proxmox · 내부망</text>
      <text v-for="lab in L.labels" :key="lab.text" :x="lab.x" :y="lab.y" class="col-label">{{ lab.text }}</text>

      <g class="edges">
        <path
          v-for="e in visibleEdges"
          :key="e.id"
          :d="e.d"
          class="edge"
          :class="[e.kind, { active: e.active, dead: e.dead, trunk: e.trunk }]"
          :style="{ strokeWidth: e.width, animationDuration: e.duration }"
          :marker-end="e.trunk ? undefined : 'url(#arrow)'"
        >
          <title>{{ e.title }}</title>
        </path>
      </g>

      <g class="edge-labels">
        <text v-for="e in visibleEdges.filter((x) => x.label)" :key="`l-${e.id}`" :x="e.lx" :y="e.ly" :text-anchor="e.anchor" class="edge-label">
          <tspan v-for="(line, i) in labelLines(e.label)" :key="i" :x="e.lx" :dy="i === 0 ? 0 : 13">{{ line }}</tspan>
        </text>
      </g>

      <g v-for="n in nodes" :key="n.id" class="node" :class="[n.health, { linked: !!n.url || !!n.select }]" @click="n.select && emit('select', n.select)">
        <component :is="n.url && !n.select ? 'a' : 'g'" v-bind="n.url && !n.select ? { href: n.url, target: '_blank', rel: 'noopener' } : {}">
          <title>{{ n.title }}</title>
          <rect :x="n.x" :y="n.y" :width="n.w" :height="n.h" rx="12" class="node-box"/>
          <circle v-if="n.health !== 'none'" :cx="n.x + 16" :cy="n.y + n.h / 2" r="5" class="node-dot"/>
          <text :x="n.x + (n.health !== 'none' ? 30 : 14)" :y="n.y + n.h / 2 + (n.sub ? -3 : 6)" class="node-title">{{ n.icon }} {{ n.label }}</text>
          <text v-if="n.sub" :x="n.x + (n.health !== 'none' ? 30 : 14)" :y="n.y + n.h / 2 + 15" class="node-sub">{{ n.sub }}</text>
        </component>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import type { Health, ServiceStatus, StatusSnapshot } from '@/types/status';

const props = defineProps<{ data: StatusSnapshot }>();
const emit = defineEmits<{ select: [id: string] }>();

const show = reactive({ traffic: true, power: true, deploy: true, logs: true });
const wrap = ref<HTMLElement | null>(null);
const narrow = ref(false);
let observer: ResizeObserver | undefined;

onMounted(() => {
  const update = () => {
    narrow.value = (wrap.value?.clientWidth ?? 1000) < 720;
  };
  update();
  if (typeof ResizeObserver !== 'undefined' && wrap.value) {
    observer = new ResizeObserver(update);
    observer.observe(wrap.value);
  }
});
onUnmounted(() => observer?.disconnect());

const NODE_H = 54;
const APP_ORDER = ['homepage', 'hwanstory', 'hwanscord', 'shootgame', 'screenshare', 'funcia', 'visit-counter', 'n8n'];
const PLATFORM_ORDER = ['jenkins', 'elk', 'mail', 'nas', 'vpn', 'proxmox'];
const DIRECT = new Set(['nas', 'proxmox', 'mail', 'vpn']);

type NodeHealth = Health | 'none';

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
  /** Service id to open in the detail panel instead of following the link. */
  select?: string;
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
  trunk?: boolean;
  label?: string;
  lx?: number;
  ly?: number;
  anchor?: 'start' | 'middle' | 'end';
}

interface Layout {
  w: number;
  h: number;
  home: { x: number; y: number; w: number; h: number };
  labels: { text: string; x: number; y: number }[];
  pos: Record<string, { x: number; y: number; w: number }>;
  apps: { x: number; w: number; top: number; step: number };
  platform: { x: number; w: number; top: number; step: number };
  trunk1: number;
  trunk2: number;
  busY: number;
}

const windowMinutes = computed(() => props.data.traffic?.windowMinutes ?? 5);

function rpm(id: string): number {
  const t = props.data.traffic;
  return t ? (t.byService[id] ?? 0) / t.windowMinutes : 0;
}

function bpsOut(id: string): number {
  const t = props.data.traffic;
  return t?.bytesByService ? (t.bytesByService[id] ?? 0) / (t.windowMinutes * 60) : 0;
}

function bpsIn(id: string): number {
  const t = props.data.traffic;
  return t?.reqBytesByService ? (t.reqBytesByService[id] ?? 0) / (t.windowMinutes * 60) : 0;
}

function byId(id: string): ServiceStatus | undefined {
  return props.data.services.find((s) => s.id === id);
}

function healthOf(id: string): NodeHealth {
  return byId(id)?.health ?? 'none';
}

function fmtRate(r: number): string {
  return r >= 10 ? `${r.toFixed(0)}/min` : `${r.toFixed(1)}/min`;
}

function fmtBps(b: number): string {
  if (b <= 0) {
    return '0';
  }
  return b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)}M/s` : b >= 1024 ? `${(b / 1024).toFixed(0)}K/s` : `${b.toFixed(0)}B/s`;
}

function trafficLabel(r: number, out: number, inb: number): string | undefined {
  if (r <= 0) {
    return undefined;
  }
  return `${fmtRate(r)} · ↑${fmtBps(out)} ↓${fmtBps(inb)}`;
}

/** Edge label in two lines (rate above, bytes below) so it fits the gaps between nodes. */
function trafficLines(r: number, out: number, inb: number, prefix = ''): string | undefined {
  if (r <= 0) {
    return undefined;
  }
  return `${prefix}${fmtRate(r)}\n↑${fmtBps(out)} ↓${fmtBps(inb)}`;
}

function labelLines(label?: string): string[] {
  return label ? label.split('\n') : [];
}

/** Wide: two service columns right of the gateway; power row on top; GitHub/Docker Hub bottom-left. */
const WIDE: Layout = {
  w: 1340,
  h: 780,
  home: { x: 540, y: 20, w: 780, h: 740 },
  labels: [
    { text: '서비스', x: 885, y: 168 },
    { text: '인프라', x: 1115, y: 168 },
  ],
  pos: {
    visitor: { x: 20, y: 373, w: 140 },
    cloudflare: { x: 270, y: 373, w: 200 },
    github: { x: 20, y: 692, w: 140 },
    dockerhub: { x: 270, y: 692, w: 200 },
    power: { x: 556, y: 76, w: 100 },
    ups: { x: 676, y: 76, w: 170 },
    host: { x: 940, y: 76, w: 370 },
    gateway: { x: 580, y: 373, w: 180 },
  },
  apps: { x: 885, w: 190, top: 180, step: 68 },
  platform: { x: 1115, w: 195, top: 180, step: 68 },
  trunk1: 830,
  trunk2: 1090,
  busY: 148,
};

/** Narrow (phones): internet on top, then the home box with power, host, gateway and one column of services. */
const NARROW: Layout = (() => {
  const nx = 40;
  const nw = 370;
  const step = 64;
  const homeY = 186;
  const appsTop = 490;
  const platformTop = appsTop + APP_ORDER.length * step + 40;
  const bottom = platformTop + (PLATFORM_ORDER.length - 1) * step + NODE_H + 16;
  return {
    w: 460,
    h: bottom + 12,
    home: { x: 20, y: homeY, w: 410, h: bottom - homeY },
    labels: [
      { text: '서비스', x: 80, y: appsTop - 12 },
      { text: '인프라', x: 80, y: platformTop - 12 },
    ],
    pos: {
      visitor: { x: nx, y: 20, w: nw },
      cloudflare: { x: nx, y: 106, w: nw },
      power: { x: nx, y: 234, w: 140 },
      ups: { x: 200, y: 234, w: 210 },
      host: { x: nx, y: 312, w: nw },
      gateway: { x: nx, y: 386, w: nw },
    },
    apps: { x: 80, w: 330, top: appsTop, step },
    platform: { x: 80, w: 330, top: platformTop, step },
    trunk1: 54,
    trunk2: 54,
    busY: 0,
  };
})();

const L = computed<Layout>(() => (narrow.value ? NARROW : WIDE));

const nodes = computed<FlowNode[]>(() => {
  const d = props.data;
  const lay = L.value;
  const out: FlowNode[] = [];
  const t = d.traffic;
  const totalRpm = t ? t.total / t.windowMinutes : null;
  const sumBytes = (m?: Record<string, number>) => (m && t ? Object.values(m).reduce((a, b) => a + b, 0) / (t.windowMinutes * 60) : 0);
  const at = (id: string, extra: Omit<FlowNode, 'x' | 'y' | 'w' | 'h' | 'id'>) => {
    const p = lay.pos[id];
    if (p) {
      out.push({ id, x: p.x, y: p.y, w: p.w, h: NODE_H, ...extra });
    }
  };

  at('visitor', { label: '방문자', icon: '🌍', sub: totalRpm !== null ? trafficLabel(totalRpm, sumBytes(t?.bytesByVhost), sumBytes(t?.reqBytesByVhost)) : undefined, health: 'none', title: '인터넷에서 오는 요청 전체' });
  at('cloudflare', { label: 'Cloudflare', icon: '☁️', sub: '프록시 · 점검 페이지 · Access', health: 'none', url: 'https://www.cloudflare.com/', title: 'DNS·프록시 · 정전 시 점검 페이지(Worker) · Kibana 앞 Access' });
  if (show.deploy && !narrow.value) {
    at('github', { label: 'GitHub', icon: '🐙', sub: 'push → webhook', health: 'none', url: 'https://github.com/akon47', title: '소스 저장소' });
    at('dockerhub', { label: 'Docker Hub', icon: '🐳', sub: 'akon47/* 이미지', health: 'none', url: 'https://hub.docker.com/u/akon47', title: '빌드된 이미지 저장소' });
  }

  const ups = d.ups;
  at('power', { label: '전원', icon: '🔌', sub: ups?.lineVolts ? `${ups.lineVolts.toFixed(0)} V` : undefined, health: ups ? (ups.onBattery ? 'down' : 'up') : 'none', title: '상용 전원' });
  at('ups', {
    label: 'UPS',
    icon: '🔋',
    sub: ups ? `${ups.chargePct?.toFixed(0) ?? '–'}% · ${ups.runtimeMin?.toFixed(0) ?? '–'}분 · 부하 ${ups.loadPct?.toFixed(0) ?? '–'}%` : '연결 안 됨',
    health: ups ? (ups.onBattery ? 'degraded' : 'up') : 'none',
    title: ups ? `${ups.model} · ${ups.status}` : 'UPS 상태를 읽지 못함',
  });
  const host = d.host;
  const running = d.guests.filter((g) => g.status === 'running').length;
  at('host', {
    label: 'Proxmox 호스트',
    icon: '🧱',
    sub: host ? `CPU ${host.cpuPct.toFixed(0)}% · RAM ${(host.mem.used / 1024 ** 3).toFixed(0)} / ${(host.mem.total / 1024 ** 3).toFixed(0)} GB · ${running}개 실행` : undefined,
    health: host ? 'up' : 'none',
    url: 'https://ve.kimhwan.kr/',
    select: byId('proxmox') ? 'proxmox' : undefined,
    title: host ? `${host.pveVersion} · 가동 ${Math.floor(host.uptimeSec / 86400)}일` : '',
  });
  const gw = byId('gateway');
  at('gateway', { label: 'nginx 관문', icon: '🚪', sub: gw?.latencyMs !== null && gw?.latencyMs !== undefined ? `TLS 종료 · ${gw.latencyMs} ms` : 'TLS 종료', health: healthOf('gateway'), select: gw ? 'gateway' : undefined, title: '모든 공개 도메인이 지나는 관문 (LXC 101)' });

  const place = (ids: string[], col: Layout['apps']) => {
    ids.forEach((id, i) => {
      const s = byId(id);
      if (!s) {
        return;
      }
      const r = rpm(id);
      const sub = r > 0 ? trafficLabel(r, bpsOut(id), bpsIn(id)) : s.latencyMs !== null ? `${s.latencyMs} ms · 대기 중` : undefined;
      out.push({ id, label: s.name, icon: s.icon, sub, x: col.x, y: col.top + i * col.step, w: col.w, h: NODE_H, health: s.health, url: s.url, select: id, title: `${s.description} · ${labelOf(s.health)}` });
    });
  };
  place(APP_ORDER.filter((id) => byId(id)), lay.apps);
  place(PLATFORM_ORDER.filter((id) => byId(id)), lay.platform);
  return out;
});

function nodeById(list: FlowNode[], id: string): FlowNode | undefined {
  return list.find((n) => n.id === id);
}

function curveLR(a: FlowNode, b: FlowNode): string {
  const ax = a.x + a.w;
  const ay = a.y + a.h / 2;
  const bx = b.x;
  const by = b.y + b.h / 2;
  const mx = (ax + bx) / 2;
  return `M ${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`;
}

function lineTB(a: FlowNode, b: FlowNode): string {
  const x = a.x + a.w / 2;
  return `M ${x} ${a.y + a.h} L ${b.x + b.w / 2} ${b.y}`;
}

function widthFor(r: number): number {
  return Math.min(1.8 + Math.log10(r + 1) * 1.1, 4.2);
}

function durationFor(r: number): string {
  if (r >= 60) {
    return '0.6s';
  }
  if (r >= 20) {
    return '1s';
  }
  if (r >= 5) {
    return '1.5s';
  }
  return '2.2s';
}

const edges = computed<FlowEdge[]>(() => {
  const ns = nodes.value;
  const d = props.data;
  const lay = L.value;
  const out: FlowEdge[] = [];
  const n = (id: string) => nodeById(ns, id);
  const visitor = n('visitor');
  const cf = n('cloudflare');
  const gw = n('gateway');
  const gwUp = healthOf('gateway') === 'up';
  if (!visitor || !cf || !gw) {
    return out;
  }

  let proxied = 0;
  let proxiedOut = 0;
  let proxiedIn = 0;
  let direct = 0;
  let directOut = 0;
  let directIn = 0;
  for (const s of d.services) {
    if (DIRECT.has(s.id)) {
      direct += rpm(s.id);
      directOut += bpsOut(s.id);
      directIn += bpsIn(s.id);
    } else {
      proxied += rpm(s.id);
      proxiedOut += bpsOut(s.id);
      proxiedIn += bpsIn(s.id);
    }
  }
  const total = proxied + direct;
  const apps = APP_ORDER.map((id) => n(id)).filter((x): x is FlowNode => !!x);
  const platform = PLATFORM_ORDER.map((id) => n(id)).filter((x): x is FlowNode => !!x);
  const lastApp = apps[apps.length - 1];
  const lastPlatform = platform[platform.length - 1];

  if (!narrow.value) {
    const midY = gw.y + gw.h / 2;
    out.push({ id: 'v-cf', d: curveLR(visitor, cf), kind: 'traffic', active: proxied > 0, dead: false, width: widthFor(proxied), duration: durationFor(proxied), title: `Cloudflare 경유 ${fmtRate(proxied)}`, label: trafficLines(proxied, proxiedOut, proxiedIn), lx: (visitor.x + visitor.w + cf.x) / 2, ly: midY - 22, anchor: 'middle' });
    out.push({ id: 'cf-gw', d: curveLR(cf, gw), kind: 'traffic', active: proxied > 0 && gwUp, dead: !gwUp, width: widthFor(proxied), duration: durationFor(proxied), title: `Cloudflare → 관문 ${fmtRate(proxied)}`, label: trafficLines(proxied, proxiedOut, proxiedIn), lx: (cf.x + cf.w + gw.x) / 2, ly: midY - 22, anchor: 'middle' });
    const vx = visitor.x + visitor.w / 2;
    out.push({ id: 'v-gw', d: `M ${vx} ${visitor.y} C ${vx} 270, ${gw.x + 40} 270, ${gw.x + 40} ${gw.y}`, kind: 'traffic', active: direct > 0 && gwUp, dead: !gwUp, width: widthFor(direct), duration: durationFor(direct), title: `직결 (Cloudflare 를 거치지 않는 NAS·Proxmox·메일·VPN) ${fmtRate(direct)}`, label: trafficLines(direct, directOut, directIn, '직결 '), lx: (vx + gw.x + 40) / 2, ly: 266, anchor: 'middle' });
    if (lastApp && lastPlatform) {
      out.push({ id: 'gw-trunk', d: `M ${gw.x + gw.w} ${midY} L ${lay.trunk1} ${midY}`, kind: 'traffic', active: false, dead: !gwUp, trunk: true, width: widthFor(total) + 1, duration: '1s', title: `관문 → 내부 서비스 ${fmtRate(total)}` });
      out.push({ id: 'trunk1', d: `M ${lay.trunk1} ${lay.busY} L ${lay.trunk1} ${lastApp.y + lastApp.h / 2}`, kind: 'traffic', active: false, dead: !gwUp, trunk: true, width: widthFor(total) + 1, duration: '1s', title: '서비스 간선' });
      out.push({ id: 'bus', d: `M ${lay.trunk1} ${lay.busY} L ${lay.trunk2} ${lay.busY}`, kind: 'traffic', active: false, dead: !gwUp, trunk: true, width: widthFor(rpmSum(platform)) + 0.5, duration: '1s', title: '인프라 간선' });
      out.push({ id: 'trunk2', d: `M ${lay.trunk2} ${lay.busY} L ${lay.trunk2} ${lastPlatform.y + lastPlatform.h / 2}`, kind: 'traffic', active: false, dead: !gwUp, trunk: true, width: widthFor(rpmSum(platform)) + 0.5, duration: '1s', title: '인프라 간선' });
    }
    apps.forEach((t) => branch(out, t, lay.trunk1, gwUp));
    platform.forEach((t) => branch(out, t, lay.trunk2, gwUp));
  } else {
    const cx = visitor.x + visitor.w / 2;
    const labelY = visitor.y + visitor.h + 13;
    out.push({ id: 'v-cf', d: lineTB(visitor, cf), kind: 'traffic', active: proxied > 0, dead: false, width: widthFor(proxied), duration: durationFor(proxied), title: `Cloudflare 경유 ${fmtRate(proxied)}`, label: trafficLines(proxied, proxiedOut, proxiedIn), lx: cx + 10, ly: labelY, anchor: 'start' });
    const rx = cf.x + cf.w;
    const cy = cf.y + cf.h / 2;
    const gy = gw.y + gw.h / 2;
    out.push({ id: 'cf-gw', d: `M ${rx} ${cy} C ${rx + 50} ${cy}, ${rx + 50} ${gy}, ${rx} ${gy}`, kind: 'traffic', active: proxied > 0 && gwUp, dead: !gwUp, width: widthFor(proxied), duration: durationFor(proxied), title: `Cloudflare → 관문 ${fmtRate(proxied)}` });
    const lx0 = visitor.x;
    const vy = visitor.y + visitor.h / 2;
    out.push({ id: 'v-gw', d: `M ${lx0} ${vy} C ${lx0 - 40} ${vy}, ${lx0 - 40} ${gy}, ${lx0} ${gy}`, kind: 'traffic', active: direct > 0 && gwUp, dead: !gwUp, width: widthFor(direct), duration: durationFor(direct), title: `직결 (NAS·Proxmox·메일·VPN) ${fmtRate(direct)}`, label: direct > 0 ? `직결 ${fmtRate(direct)}` : undefined, lx: visitor.x, ly: labelY, anchor: 'start' });
    const last = lastPlatform ?? lastApp;
    if (last) {
      const gx = gw.x + 60;
      const ty = gw.y + gw.h + 24;
      out.push({ id: 'gw-trunk', d: `M ${gx} ${gw.y + gw.h} L ${gx} ${ty} L ${lay.trunk1} ${ty}`, kind: 'traffic', active: false, dead: !gwUp, trunk: true, width: widthFor(total) + 1, duration: '1s', title: `관문 → 내부 서비스 ${fmtRate(total)}` });
      out.push({ id: 'trunk1', d: `M ${lay.trunk1} ${ty} L ${lay.trunk1} ${last.y + last.h / 2}`, kind: 'traffic', active: false, dead: !gwUp, trunk: true, width: widthFor(total) + 1, duration: '1s', title: '간선' });
    }
    [...apps, ...platform].forEach((t) => branch(out, t, lay.trunk1, gwUp));
  }

  const power = n('power');
  const ups = n('ups');
  const host = n('host');
  if (power && ups && host) {
    const onBattery = d.ups?.onBattery ?? false;
    out.push({ id: 'p-ups', d: curveLR(power, ups), kind: 'power', active: !!d.ups && !onBattery, dead: onBattery, width: 2.6, duration: '1.2s', title: onBattery ? '정전: 상용 전원 끊김' : '상용 전원 정상' });
    const loadLabel = d.ups?.nominalPowerW ? `${d.ups.loadPct?.toFixed(0) ?? '–'}% of ${d.ups.nominalPowerW} W` : undefined;
    if (!narrow.value) {
      out.push({ id: 'ups-host', d: curveLR(ups, host), kind: 'power', active: !!d.ups, dead: false, width: 2.6, duration: onBattery ? '0.5s' : '1.2s', title: onBattery ? '배터리로 호스트에 전원 공급 중' : 'UPS 경유 전원 공급', label: loadLabel, lx: (ups.x + ups.w + host.x) / 2, ly: ups.y + ups.h / 2 - 9, anchor: 'middle' });
    } else {
      const ux = ups.x + ups.w / 2;
      out.push({ id: 'ups-host', d: `M ${ux} ${ups.y + ups.h} L ${ux} ${host.y}`, kind: 'power', active: !!d.ups, dead: false, width: 2.6, duration: onBattery ? '0.5s' : '1.2s', title: 'UPS 경유 전원 공급', label: loadLabel, lx: ux + 8, ly: ups.y + ups.h + 16, anchor: 'start' });
    }
  }

  if (!narrow.value) {
    const gh = n('github');
    const dh = n('dockerhub');
    const jenkins = n('jenkins');
    if (gh && dh && jenkins) {
      const jUp = healthOf('jenkins') === 'up';
      out.push({ id: 'gh-j', d: `M ${gh.x + gh.w} ${gh.y + gh.h / 2 - 10} C ${gh.x + gh.w + 160} ${gh.y - 110}, ${jenkins.x - 40} ${jenkins.y + jenkins.h / 2 + 120}, ${jenkins.x + 30} ${jenkins.y + jenkins.h}`, kind: 'deploy', active: jUp, dead: !jUp, width: 1.8, duration: '2.4s', title: 'GitHub push → Jenkins 웹훅' });
      out.push({ id: 'j-dh', d: `M ${jenkins.x + jenkins.w / 2} ${jenkins.y + jenkins.h} C ${jenkins.x + jenkins.w / 2} 560, ${dh.x + dh.w + 120} ${dh.y - 80}, ${dh.x + dh.w} ${dh.y + dh.h / 2 - 10}`, kind: 'deploy', active: jUp, dead: !jUp, width: 1.8, duration: '2.4s', title: 'Jenkins → Docker Hub 이미지 푸시' });
      if (lastApp) {
        out.push({ id: 'dh-apps', d: `M ${dh.x + dh.w} ${dh.y + dh.h / 2 + 10} C ${dh.x + dh.w + 110} ${dh.y + 60}, ${lay.apps.x - 90} ${lastApp.y + lastApp.h + 60}, ${lay.apps.x + lay.apps.w / 2} ${lastApp.y + lastApp.h}`, kind: 'deploy', active: jUp, dead: false, width: 1.8, duration: '2.4s', title: 'VM 이 Docker Hub 에서 이미지를 받아 compose 로 배포' });
      }
    }
    const elk = n('elk');
    if (elk) {
      const elkUp = healthOf('elk') === 'up';
      const gx = gw.x + gw.w / 2;
      out.push({ id: 'gw-elk', d: `M ${gx} ${gw.y + gw.h} C ${gx} 640, ${elk.x + elk.w / 2} 640, ${elk.x + elk.w / 2} ${elk.y + elk.h}`, kind: 'logs', active: elkUp && gwUp, dead: !elkUp, width: 1.8, duration: '2s', title: 'filebeat → Logstash → Elasticsearch → Kibana' });
    }
  }
  return out;
});

function branch(out: FlowEdge[], target: FlowNode, trunkX: number, gwUp: boolean) {
  const s = byId(target.id);
  if (!s) {
    return;
  }
  const r = rpm(s.id);
  const dead = s.health === 'down' || !gwUp;
  const y = target.y + target.h / 2;
  out.push({ id: `br-${s.id}`, d: `M ${trunkX} ${y} L ${target.x} ${y}`, kind: 'traffic', active: r > 0 && !dead, dead, width: widthFor(r), duration: durationFor(r), title: `${s.name}: ${r > 0 ? `${fmtRate(r)} · ↑${fmtBps(bpsOut(s.id))} ↓${fmtBps(bpsIn(s.id))}` : '최근 요청 없음'}` });
}

const visibleEdges = computed(() => edges.value.filter((e) => show[e.kind]));

function rpmSum(list: FlowNode[]): number {
  return list.reduce((sum, x) => sum + rpm(x.id), 0);
}

function labelOf(h: Health): string {
  return { up: '정상', degraded: '일부 문제', down: '중단' }[h];
}
</script>

<style scoped>
.flow-map {
  width: 100%;
}

.toggles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  font-size: 12px;
  margin-bottom: 8px;
}

.toggles label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.toggles input {
  accent-color: var(--link-accent-color);
  margin: 0;
}

.toggles .hint {
  opacity: 0.6;
  margin-left: auto;
}

.flow-svg {
  width: 100%;
  height: auto;
  display: block;
  font-family: var(--base-font-family);
  user-select: none;
}

.home-box {
  fill: var(--menu-hover-color);
  fill-opacity: 0.35;
  stroke: var(--border-color);
  stroke-width: 1.5;
  stroke-dasharray: 7 6;
}

.home-label {
  font-size: 15px;
  font-weight: bold;
  fill: var(--base-color);
  opacity: 0.8;
}

.col-label {
  font-size: 12px;
  fill: var(--base-color);
  opacity: 0.55;
  letter-spacing: 0.1em;
}

.edge {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.32;
  transition: opacity 0.3s;
}

.edge.traffic { stroke: var(--link-accent-color); }
.edge.power { stroke: #2ea043; }
.edge.deploy { stroke: #1abc9c; stroke-dasharray: 4 7; }
.edge.logs { stroke: #a371f7; stroke-dasharray: 2 7; }

.edge.trunk {
  opacity: 0.45;
  stroke-linecap: butt;
}

.edge.active {
  opacity: 0.9;
  stroke-dasharray: 8 10; /* period 18 */
  animation: flow18 linear infinite;
}

.edge.deploy.active { stroke-dasharray: 4 9; animation-name: flow13; }
.edge.logs.active { stroke-dasharray: 2 8; animation-name: flow10; }
.edge.power.active { stroke-dasharray: 11 9; animation-name: flow20; }

.edge.dead {
  stroke: #f85149;
  stroke-dasharray: 3 6;
  opacity: 0.6;
  animation: none;
}

.edge:hover { opacity: 1; }

@keyframes flow18 { to { stroke-dashoffset: -36; } }
@keyframes flow13 { to { stroke-dashoffset: -39; } }
@keyframes flow10 { to { stroke-dashoffset: -40; } }
@keyframes flow20 { to { stroke-dashoffset: -40; } }

.edge-label {
  font-size: 12px;
  font-weight: 500;
  fill: var(--base-color);
  opacity: 0.85;
  paint-order: stroke;
  stroke: var(--content-background-color);
  stroke-width: 4px;
  stroke-linejoin: round;
  pointer-events: none;
}

.node text {
  pointer-events: none;
  user-select: none;
}

.node.linked {
  cursor: pointer;
}

.node-box {
  fill: var(--content-background-color);
  stroke: var(--border-color);
  stroke-width: 1.5;
  transition: stroke 0.2s, filter 0.2s;
}

.node.up .node-box { stroke: rgba(46, 160, 67, 0.7); }
.node.degraded .node-box { stroke: rgba(210, 153, 34, 0.85); }
.node.down .node-box { stroke: rgba(248, 81, 73, 0.9); stroke-width: 2; }
.node.linked:hover .node-box { stroke: var(--link-accent-color); filter: drop-shadow(0 3px 6px var(--base-shadow-color)); }

.node-dot { fill: #8b949e; }
.node.up .node-dot { fill: #2ea043; }
.node.degraded .node-dot { fill: #d29922; }
.node.down .node-dot { fill: #f85149; }

.node-title {
  font-size: 15px;
  font-weight: bold;
  fill: var(--base-color);
}

.node-sub {
  font-size: 11.5px;
  fill: var(--base-color);
  opacity: 0.65;
}

.flow-svg.narrow .node-title { font-size: 16px; }
.flow-svg.narrow .node-sub { font-size: 12.5px; }
.flow-svg.narrow .edge-label { font-size: 12.5px; }

.sw {
  display: inline-block;
  width: 20px;
  height: 0;
  border-top: 3px solid;
  vertical-align: middle;
}

.sw.traffic { border-color: var(--link-accent-color); }
.sw.power { border-color: #2ea043; }
.sw.deploy { border-color: #1abc9c; border-top-style: dashed; }
.sw.logs { border-color: #a371f7; border-top-style: dotted; }

@media (prefers-reduced-motion: reduce) {
  .edge.active { animation: none; }
}
</style>
