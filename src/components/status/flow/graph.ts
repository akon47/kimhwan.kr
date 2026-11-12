/**
 * Turns a status snapshot into the nodes and edges of the flow map. No DOM here; labels and tooltips are
 * worded in the current language.
 * Geometry comes from layout.ts; FlowMap.vue only renders the result.
 */
import { messages } from '@/i18n';
import type { Health, ServiceStatus, StatusSnapshot } from '@/types/status';
import { formatBps, formatRate } from '@/utils/format';
import { healthLabel, runningGuestCount, serviceDescription, serviceTraffic, type TrafficRate } from '@/utils/status';
import { APP_ORDER, DIRECT_SERVICES, NODE_HEIGHT, PLATFORM_ORDER, type Column, type FlowLayout } from './layout';

export type NodeHealth = Health | 'none';
export type EdgeKind = 'traffic' | 'power' | 'deploy' | 'logs';

export interface FlowNode {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly sub?: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly health: NodeHealth;
  readonly url?: string;
  /** Id to open in the detail panel instead of following the link. */
  readonly select?: string;
  readonly title: string;
}

export interface FlowEdge {
  readonly id: string;
  /** SVG path data. */
  readonly d: string;
  readonly kind: EdgeKind;
  /** Something is flowing: drawn as moving dashes. */
  readonly active: boolean;
  /** The path is broken (an end is down). */
  readonly dead: boolean;
  readonly width: number;
  /** Dash animation period; shorter = busier. */
  readonly duration: string;
  readonly title: string;
  /** Shared line that branches come off; drawn without an arrowhead. */
  readonly trunk?: boolean;
  /** Optional label, lines separated by "\n". */
  readonly label?: string;
  readonly lx?: number;
  readonly ly?: number;
  readonly anchor?: 'start' | 'middle' | 'end';
}

export interface BuildOptions {
  readonly narrow: boolean;
  /** Draw the GitHub and Docker Hub nodes (wide layout only). */
  readonly showDeploy: boolean;
}

type NodeContent = Omit<FlowNode, 'id' | 'x' | 'y' | 'w' | 'h'>;

/** Edge ids of the lines from a trunk to a service are this prefix plus the service id. */
const BRANCH_PREFIX = 'br-';

/* ---------- formatting ---------- */

function bytesLabel(rate: TrafficRate): string {
  return `↑${formatBps(rate.bpsOut, { compact: true })} ↓${formatBps(rate.bpsIn, { compact: true })}`;
}

function trafficLabel(rate: TrafficRate): string | undefined {
  return rate.rpm > 0 ? `${formatRate(rate.rpm)} · ${bytesLabel(rate)}` : undefined;
}

/** Edge label in two lines (rate above, bytes below) so it fits the gaps between nodes. */
function trafficLines(rate: TrafficRate, prefix = ''): string | undefined {
  return rate.rpm > 0 ? `${prefix}${formatRate(rate.rpm)}\n${bytesLabel(rate)}` : undefined;
}

function addRates(a: TrafficRate, b: TrafficRate): TrafficRate {
  return { rpm: a.rpm + b.rpm, bpsOut: a.bpsOut + b.bpsOut, bpsIn: a.bpsIn + b.bpsIn };
}

const ZERO_RATE: TrafficRate = { rpm: 0, bpsOut: 0, bpsIn: 0 };

/* ---------- geometry ---------- */

function curveLeftToRight(a: FlowNode, b: FlowNode): string {
  const ax = a.x + a.w;
  const ay = a.y + a.h / 2;
  const bx = b.x;
  const by = b.y + b.h / 2;
  const mx = (ax + bx) / 2;
  return `M ${ax} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${bx} ${by}`;
}

function lineTopToBottom(a: FlowNode, b: FlowNode): string {
  return `M ${a.x + a.w / 2} ${a.y + a.h} L ${b.x + b.w / 2} ${b.y}`;
}

/** Busier edges are thicker (log scale, capped). */
function widthFor(rpm: number): number {
  return Math.min(1.8 + Math.log10(rpm + 1) * 1.1, 4.2);
}

/** Busier edges animate faster. */
function durationFor(rpm: number): string {
  if (rpm >= 60) {
    return '0.6s';
  }
  if (rpm >= 20) {
    return '1s';
  }
  return rpm >= 5 ? '1.5s' : '2.2s';
}

/* ---------- nodes ---------- */

export function buildNodes(data: StatusSnapshot, layout: FlowLayout, { narrow, showDeploy }: BuildOptions): FlowNode[] {
  const nodes: FlowNode[] = [];
  const text = messages.value.status.flow;
  const traffic = data.traffic;
  const service = (id: string): ServiceStatus | undefined => data.services.find((s) => s.id === id);

  const place = (id: string, content: NodeContent) => {
    const p = layout.pos[id];
    if (p) {
      nodes.push({ id, x: p.x, y: p.y, w: p.w, h: NODE_HEIGHT, ...content });
    }
  };

  const sumPerSecond = (byVhost?: Record<string, number>) =>
    byVhost && traffic ? Object.values(byVhost).reduce((a, b) => a + b, 0) / (traffic.windowMinutes * 60) : 0;

  place('visitor', {
    label: text.visitor,
    icon: '🌍',
    sub: traffic
      ? trafficLabel({
          rpm: traffic.total / traffic.windowMinutes,
          bpsOut: sumPerSecond(traffic.bytesByVhost),
          bpsIn: sumPerSecond(traffic.reqBytesByVhost),
        })
      : undefined,
    health: 'none',
    title: text.visitorTitle,
  });
  place('cloudflare', {
    label: 'Cloudflare',
    icon: '☁️',
    sub: text.cloudflareSub,
    health: 'none',
    url: 'https://www.cloudflare.com/',
    title: text.cloudflareTitle,
  });
  if (showDeploy && !narrow) {
    place('github', {
      label: 'GitHub',
      icon: '🐙',
      sub: 'push → webhook',
      health: 'none',
      url: 'https://github.com/akon47',
      title: text.githubTitle,
    });
    place('dockerhub', {
      label: 'Docker Hub',
      icon: '🐳',
      sub: text.dockerhubSub,
      health: 'none',
      url: 'https://hub.docker.com/u/akon47',
      title: text.dockerhubTitle,
    });
  }

  const ups = data.ups;
  place('power', {
    label: text.power,
    icon: '🔌',
    sub: ups?.lineVolts ? `${ups.lineVolts.toFixed(0)} V` : undefined,
    health: ups ? (ups.onBattery ? 'down' : 'up') : 'none',
    select: ups ? 'ups' : undefined,
    title: text.powerTitle,
  });
  place('ups', {
    label: 'UPS',
    icon: '🔋',
    sub: ups
      ? text.upsSub(ups.chargePct?.toFixed(0) ?? '–', ups.runtimeMin?.toFixed(0) ?? '–', ups.loadPct?.toFixed(0) ?? '–')
      : text.upsMissing,
    health: ups ? (ups.onBattery ? 'degraded' : 'up') : 'none',
    select: ups ? 'ups' : undefined,
    title: ups ? text.upsTitle(ups.model, ups.status) : text.upsUnread,
  });

  const host = data.host;
  const gib = 1024 ** 3;
  place('host', {
    label: text.host,
    icon: '🧱',
    sub: host
      ? text.hostSub(host.cpuPct.toFixed(0), (host.mem.used / gib).toFixed(0), (host.mem.total / gib).toFixed(0), runningGuestCount(data))
      : undefined,
    health: host ? 'up' : 'none',
    url: 'https://ve.kimhwan.kr/',
    select: service('proxmox') ? 'proxmox' : undefined,
    title: host ? text.hostTitle(host.pveVersion, Math.floor(host.uptimeSec / 86_400)) : '',
  });

  const gateway = service('gateway');
  place('gateway', {
    label: text.gateway,
    icon: '🚪',
    sub: typeof gateway?.latencyMs === 'number' ? `${text.gatewaySub} · ${gateway.latencyMs} ms` : text.gatewaySub,
    health: gateway?.health ?? 'none',
    select: gateway ? 'gateway' : undefined,
    title: text.gatewayTitle,
  });

  const placeColumn = (ids: readonly string[], column: Column) => {
    const present = ids.map(service).filter((s): s is ServiceStatus => !!s);
    present.forEach((s, index) => {
      const rate = serviceTraffic(traffic, s.id);
      nodes.push({
        id: s.id,
        label: s.name,
        icon: s.icon,
        sub: trafficLabel(rate) ?? (s.latencyMs !== null ? text.idle(s.latencyMs) : undefined),
        x: column.x,
        y: column.top + index * column.step,
        w: column.w,
        h: NODE_HEIGHT,
        health: s.health,
        url: s.url,
        select: s.id,
        title: `${serviceDescription(s)} · ${healthLabel(s.health)}`,
      });
    });
  };
  placeColumn(APP_ORDER, layout.apps);
  placeColumn(PLATFORM_ORDER, layout.platform);

  return nodes;
}

/* ---------- edges ---------- */

export function buildEdges(data: StatusSnapshot, nodes: readonly FlowNode[], layout: FlowLayout, narrow: boolean): FlowEdge[] {
  const edges: FlowEdge[] = [];
  const text = messages.value.status.flow;
  const node = (id: string) => nodes.find((n) => n.id === id);
  const service = (id: string) => data.services.find((s) => s.id === id);
  const isUp = (id: string) => service(id)?.health === 'up';
  const rate = (id: string) => serviceTraffic(data.traffic, id);

  const visitor = node('visitor');
  const cloudflare = node('cloudflare');
  const gateway = node('gateway');
  if (!visitor || !cloudflare || !gateway) {
    return edges;
  }
  const gatewayUp = isUp('gateway');

  let proxied = ZERO_RATE;
  let direct = ZERO_RATE;
  for (const s of data.services) {
    if (DIRECT_SERVICES.has(s.id)) {
      direct = addRates(direct, rate(s.id));
    } else {
      proxied = addRates(proxied, rate(s.id));
    }
  }
  const totalRpm = proxied.rpm + direct.rpm;

  const present = (ids: readonly string[]) => ids.map(node).filter((n): n is FlowNode => !!n);
  const apps = present(APP_ORDER);
  const platform = present(PLATFORM_ORDER);
  const lastApp = apps[apps.length - 1];
  const lastPlatform = platform[platform.length - 1];
  const platformRpm = platform.reduce((sum, n) => sum + rate(n.id).rpm, 0);

  const trunk = (id: string, d: string, rpm: number, extraWidth: number, title: string) => {
    edges.push({ id, d, kind: 'traffic', active: false, dead: !gatewayUp, trunk: true, width: widthFor(rpm) + extraWidth, duration: '1s', title });
  };

  const branch = (target: FlowNode, trunkX: number) => {
    const s = service(target.id);
    if (!s) {
      return;
    }
    const r = rate(s.id);
    const dead = s.health === 'down' || !gatewayUp;
    const y = target.y + target.h / 2;
    edges.push({
      id: `${BRANCH_PREFIX}${s.id}`,
      d: `M ${trunkX} ${y} L ${target.x} ${y}`,
      kind: 'traffic',
      active: r.rpm > 0 && !dead,
      dead,
      width: widthFor(r.rpm),
      duration: durationFor(r.rpm),
      title: `${s.name}: ${trafficLabel(r) ?? text.noRequests}`,
    });
  };

  const proxiedStyle = { kind: 'traffic', width: widthFor(proxied.rpm), duration: durationFor(proxied.rpm) } as const;
  const directStyle = { kind: 'traffic', width: widthFor(direct.rpm), duration: durationFor(direct.rpm) } as const;

  if (!narrow) {
    const midY = gateway.y + gateway.h / 2;
    const visitorCx = visitor.x + visitor.w / 2;
    const gapMid = (visitor.y + visitor.h + cloudflare.y) / 2;
    edges.push({
      ...proxiedStyle,
      id: 'v-cf',
      d: `M ${visitorCx} ${visitor.y + visitor.h} L ${visitorCx} ${cloudflare.y}`,
      active: proxied.rpm > 0,
      dead: false,
      title: text.viaCloudflare(formatRate(proxied.rpm)),
      label: trafficLines(proxied),
      lx: visitorCx + 10,
      ly: gapMid - 4,
      anchor: 'start',
    });
    edges.push({
      ...proxiedStyle,
      id: 'cf-gw',
      d: curveLeftToRight(cloudflare, gateway),
      active: proxied.rpm > 0 && gatewayUp,
      dead: !gatewayUp,
      title: text.cloudflareToGateway(formatRate(proxied.rpm)),
      label: trafficLines(proxied),
      lx: (cloudflare.x + cloudflare.w + gateway.x) / 2,
      ly: midY - 22,
      anchor: 'middle',
    });
    const vx = visitor.x + visitor.w;
    const vy = visitor.y + visitor.h / 2;
    const gx = gateway.x + 40;
    edges.push({
      ...directStyle,
      id: 'v-gw',
      d: `M ${vx} ${vy} C ${vx + 60} ${vy}, ${gx} ${vy + 20}, ${gx} ${gateway.y}`,
      active: direct.rpm > 0 && gatewayUp,
      dead: !gatewayUp,
      title: text.direct(formatRate(direct.rpm)),
      label: trafficLines(direct, text.directPrefix),
      lx: (vx + gx) / 2,
      ly: vy - 27,
      anchor: 'middle',
    });
    if (lastApp && lastPlatform) {
      const { trunk1, trunk2, busY } = layout;
      trunk('gw-trunk', `M ${gateway.x + gateway.w} ${midY} L ${trunk1} ${midY}`, totalRpm, 1, text.gatewayToServices(formatRate(totalRpm)));
      trunk('trunk1', `M ${trunk1} ${busY} L ${trunk1} ${lastApp.y + lastApp.h / 2}`, totalRpm, 1, text.appsTrunk);
      trunk('bus', `M ${trunk1} ${busY} L ${trunk2} ${busY}`, platformRpm, 0.5, text.platformTrunk);
      trunk('trunk2', `M ${trunk2} ${busY} L ${trunk2} ${lastPlatform.y + lastPlatform.h / 2}`, platformRpm, 0.5, text.platformTrunk);
    }
    apps.forEach((n) => branch(n, layout.trunk1));
    platform.forEach((n) => branch(n, layout.trunk2));
  } else {
    const cx = visitor.x + visitor.w / 2;
    const labelY = visitor.y + visitor.h + 13;
    edges.push({
      ...proxiedStyle,
      id: 'v-cf',
      d: lineTopToBottom(visitor, cloudflare),
      active: proxied.rpm > 0,
      dead: false,
      title: text.viaCloudflare(formatRate(proxied.rpm)),
      label: trafficLines(proxied),
      lx: cx + 10,
      ly: labelY,
      anchor: 'start',
    });
    const rx = cloudflare.x + cloudflare.w;
    const cy = cloudflare.y + cloudflare.h / 2;
    const gy = gateway.y + gateway.h / 2;
    edges.push({
      ...proxiedStyle,
      id: 'cf-gw',
      d: `M ${rx} ${cy} C ${rx + 50} ${cy}, ${rx + 50} ${gy}, ${rx} ${gy}`,
      active: proxied.rpm > 0 && gatewayUp,
      dead: !gatewayUp,
      title: text.cloudflareToGateway(formatRate(proxied.rpm)),
    });
    const lx0 = visitor.x;
    const vy = visitor.y + visitor.h / 2;
    edges.push({
      ...directStyle,
      id: 'v-gw',
      d: `M ${lx0} ${vy} C ${lx0 - 40} ${vy}, ${lx0 - 40} ${gy}, ${lx0} ${gy}`,
      active: direct.rpm > 0 && gatewayUp,
      dead: !gatewayUp,
      title: text.direct(formatRate(direct.rpm)),
      label: direct.rpm > 0 ? `${text.directPrefix}${formatRate(direct.rpm)}` : undefined,
      lx: visitor.x,
      ly: labelY,
      anchor: 'start',
    });
    const last = lastPlatform ?? lastApp;
    if (last) {
      const gx = gateway.x + 60;
      const ty = gateway.y + gateway.h + 24;
      const { trunk1 } = layout;
      trunk('gw-trunk', `M ${gx} ${gateway.y + gateway.h} L ${gx} ${ty} L ${trunk1} ${ty}`, totalRpm, 1, text.gatewayToServices(formatRate(totalRpm)));
      trunk('trunk1', `M ${trunk1} ${ty} L ${trunk1} ${last.y + last.h / 2}`, totalRpm, 1, text.trunk);
    }
    [...apps, ...platform].forEach((n) => branch(n, layout.trunk1));
  }

  /* power: mains → UPS → host */
  const power = node('power');
  const ups = node('ups');
  const host = node('host');
  if (power && ups && host) {
    const hasUps = !!data.ups;
    const onBattery = data.ups?.onBattery ?? false;
    edges.push({
      id: 'p-ups',
      d: curveLeftToRight(power, ups),
      kind: 'power',
      active: hasUps && !onBattery,
      dead: onBattery,
      width: 2.6,
      duration: '1.2s',
      title: onBattery ? text.outage : text.mainsOk,
    });
    const loadLabel = data.ups?.nominalPowerW ? `${data.ups.loadPct?.toFixed(0) ?? '–'}% of ${data.ups.nominalPowerW} W` : undefined;
    const upsToHost = { id: 'ups-host', kind: 'power', active: hasUps, dead: false, width: 2.6, duration: onBattery ? '0.5s' : '1.2s', label: loadLabel } as const;
    if (!narrow) {
      edges.push({
        ...upsToHost,
        d: curveLeftToRight(ups, host),
        title: onBattery ? text.onBattery : text.throughUps,
        lx: (ups.x + ups.w + host.x) / 2,
        ly: ups.y + ups.h / 2 - 9,
        anchor: 'middle',
      });
    } else {
      const ux = ups.x + ups.w / 2;
      edges.push({
        ...upsToHost,
        d: `M ${ux} ${ups.y + ups.h} L ${ux} ${host.y}`,
        title: text.throughUps,
        lx: ux + 8,
        ly: ups.y + ups.h + 16,
        anchor: 'start',
      });
    }
  }

  /* deploy and log overlays (wide layout only) */
  if (!narrow) {
    const github = node('github');
    const dockerhub = node('dockerhub');
    const jenkins = node('jenkins');
    if (github && dockerhub && jenkins) {
      const jenkinsUp = isUp('jenkins');
      const deploy = { kind: 'deploy', active: jenkinsUp, width: 1.8, duration: '2.4s' } as const;
      const ghRight = github.x + github.w;
      const dhRight = dockerhub.x + dockerhub.w;
      const jenkinsCx = jenkins.x + jenkins.w / 2;
      const jenkinsBottom = jenkins.y + jenkins.h;
      edges.push({
        ...deploy,
        id: 'gh-j',
        d: `M ${ghRight} ${github.y + github.h / 2 - 10} C ${ghRight + 160} ${github.y - 110}, ${jenkins.x - 40} ${jenkins.y + jenkins.h / 2 + 120}, ${jenkins.x + 30} ${jenkinsBottom}`,
        dead: !jenkinsUp,
        title: text.webhook,
      });
      edges.push({
        ...deploy,
        id: 'j-dh',
        d: `M ${jenkinsCx} ${jenkinsBottom} C ${jenkinsCx} 560, ${dhRight + 120} ${dockerhub.y - 80}, ${dhRight} ${dockerhub.y + dockerhub.h / 2 - 10}`,
        dead: !jenkinsUp,
        title: text.imagePush,
      });
      if (lastApp) {
        const appsCx = layout.apps.x + layout.apps.w / 2;
        const appsBottom = lastApp.y + lastApp.h;
        edges.push({
          ...deploy,
          id: 'dh-apps',
          d: `M ${dhRight} ${dockerhub.y + dockerhub.h / 2 + 10} C ${dhRight + 110} ${dockerhub.y + 60}, ${layout.apps.x - 90} ${appsBottom + 60}, ${appsCx} ${appsBottom}`,
          dead: false,
          title: text.rollout,
        });
      }
    }
    const elk = node('elk');
    if (elk) {
      const elkUp = isUp('elk');
      const gx = gateway.x + gateway.w / 2;
      const elkCx = elk.x + elk.w / 2;
      edges.push({
        id: 'gw-elk',
        d: `M ${gx} ${gateway.y + gateway.h} C ${gx} 640, ${elkCx} 640, ${elkCx} ${elk.y + elk.h}`,
        kind: 'logs',
        active: elkUp && gatewayUp,
        dead: !elkUp,
        width: 1.8,
        duration: '2s',
        title: 'filebeat → Logstash → Elasticsearch → Kibana',
      });
    }
  }

  return edges;
}

/* ---------- live pulses ---------- */

/**
 * The route one request to `serviceId` takes across the map, as a single path for a moving dot:
 * visitor (through Cloudflare, or straight in for direct services) → gateway → trunk → the service.
 * Null when that service is not drawn. On phones the dot starts at the gateway.
 */
export function pulsePath(
  serviceId: string,
  nodes: readonly FlowNode[],
  edges: readonly FlowEdge[],
  layout: FlowLayout,
  narrow: boolean,
): string | null {
  const node = (id: string) => nodes.find((n) => n.id === id);
  const target = node(serviceId);
  const gateway = node('gateway');
  if (!target || !gateway || target.id === gateway.id || !edges.some((edge) => edge.id === `${BRANCH_PREFIX}${serviceId}`)) {
    return null;
  }
  const targetY = target.y + target.h / 2;

  if (narrow) {
    const gx = gateway.x + 60;
    const turnY = gateway.y + gateway.h + 24;
    return `M ${gx} ${gateway.y + gateway.h} L ${gx} ${turnY} L ${layout.trunk1} ${turnY} L ${layout.trunk1} ${targetY} L ${target.x} ${targetY}`;
  }

  const inbound = edges.find((edge) => edge.id === (DIRECT_SERVICES.has(serviceId) ? 'v-gw' : 'cf-gw'));
  const midY = gateway.y + gateway.h / 2;
  const start = inbound ? `${inbound.d} L` : 'M';
  const throughGateway = `${start} ${gateway.x + gateway.w} ${midY} L ${layout.trunk1} ${midY}`;
  const onPlatformColumn = target.x === layout.platform.x;
  const toColumn = onPlatformColumn
    ? ` L ${layout.trunk1} ${layout.busY} L ${layout.trunk2} ${layout.busY} L ${layout.trunk2} ${targetY}`
    : ` L ${layout.trunk1} ${targetY}`;
  return `${throughGateway}${toColumn} L ${target.x} ${targetY}`;
}

/* ---------- hover ---------- */

/** Which two nodes an edge joins (trunks belong to the gateway; branches come off the trunk). */
const EDGE_ENDPOINTS: Readonly<Record<string, readonly [string, string]>> = {
  'v-cf': ['visitor', 'cloudflare'],
  'cf-gw': ['cloudflare', 'gateway'],
  'v-gw': ['visitor', 'gateway'],
  'gw-trunk': ['gateway', 'trunk'],
  trunk1: ['gateway', 'trunk'],
  bus: ['gateway', 'trunk'],
  trunk2: ['gateway', 'trunk'],
  'p-ups': ['power', 'ups'],
  'ups-host': ['ups', 'host'],
  'gh-j': ['github', 'jenkins'],
  'j-dh': ['jenkins', 'dockerhub'],
  'dh-apps': ['dockerhub', 'apps'],
  'gw-elk': ['gateway', 'elk'],
};

export function edgeTouchesNode(edgeId: string, nodeId: string): boolean {
  if (edgeId.startsWith(BRANCH_PREFIX)) {
    return edgeId.slice(BRANCH_PREFIX.length) === nodeId;
  }
  return EDGE_ENDPOINTS[edgeId]?.includes(nodeId) ?? false;
}
