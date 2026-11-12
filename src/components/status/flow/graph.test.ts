import { describe, expect, it } from 'vitest';
import type { ServiceStatus, StatusSnapshot } from '@/types/status';
import { buildEdges, buildNodes, edgeTouchesNode, pulsePath } from './graph';
import { NARROW_LAYOUT, WIDE_LAYOUT } from './layout';

function service(id: string, overrides: Partial<ServiceStatus> = {}): ServiceStatus {
  return { id, name: id, description: '', category: 'apps', icon: '•', health: 'up', latencyMs: 10, checks: [], ...overrides };
}

function snapshot(overrides: Partial<StatusSnapshot> = {}): StatusSnapshot {
  return {
    generatedAt: '2026-11-12T00:00:00Z',
    version: 'test',
    overall: 'up',
    summary: { up: 4, degraded: 0, down: 0 },
    services: [service('gateway', { category: 'platform' }), service('homepage'), service('jenkins', { category: 'platform' }), service('elk', { category: 'platform' }), service('nas', { category: 'platform' })],
    host: null,
    storages: [],
    disks: [],
    guests: [],
    backup: null,
    ups: null,
    traffic: { windowMinutes: 5, total: 150, byVhost: {}, byService: { homepage: 100, nas: 50 } },
    errors: [],
    ...overrides,
  };
}

function build(data: StatusSnapshot, narrow = false, showDeploy = true) {
  const layout = narrow ? NARROW_LAYOUT : WIDE_LAYOUT;
  const nodes = buildNodes(data, layout, { narrow, showDeploy });
  return { nodes, edges: buildEdges(data, nodes, layout, narrow) };
}

describe('buildNodes', () => {
  it('draws only the services the API reports', () => {
    const ids = build(snapshot()).nodes.map((node) => node.id);
    expect(ids).toContain('homepage');
    expect(ids).not.toContain('hwanstory');
  });

  it('leaves out GitHub and Docker Hub on phones and when the deploy overlay is off', () => {
    const has = (nodes: { id: string }[]) => nodes.some((node) => node.id === 'github');
    expect(has(build(snapshot()).nodes)).toBe(true);
    expect(has(build(snapshot(), true).nodes)).toBe(false);
    expect(has(build(snapshot(), false, false).nodes)).toBe(false);
  });
});

describe('buildEdges', () => {
  it('splits traffic into proxied and direct', () => {
    const { edges } = build(snapshot());
    const title = (id: string) => edges.find((edge) => edge.id === id)?.title;
    expect(title('cf-gw')).toContain('20/min');
    expect(title('v-gw')).toContain('10/min');
  });

  it('animates a branch only when its service has traffic', () => {
    const { edges } = build(snapshot());
    expect(edges.find((edge) => edge.id === 'br-homepage')?.active).toBe(true);
    expect(edges.find((edge) => edge.id === 'br-jenkins')?.active).toBe(false);
  });

  it('marks everything behind a failed gateway as dead', () => {
    const data = snapshot();
    const down = snapshot({ services: data.services.map((s) => (s.id === 'gateway' ? { ...s, health: 'down' } : s)) });
    const branch = build(down).edges.find((edge) => edge.id === 'br-homepage');
    expect(branch).toMatchObject({ dead: true, active: false });
  });

  it('produces finite geometry in both layouts', () => {
    for (const narrow of [false, true]) {
      for (const edge of build(snapshot(), narrow).edges) {
        expect(edge.d).not.toMatch(/NaN|undefined/);
      }
    }
  });
});

describe('pulsePath', () => {
  it('runs from the inbound edge to the service, through the bus for the platform column', () => {
    const { nodes, edges } = build(snapshot());
    const app = pulsePath('homepage', nodes, edges, WIDE_LAYOUT, false);
    const platform = pulsePath('nas', nodes, edges, WIDE_LAYOUT, false);
    const homepage = nodes.find((node) => node.id === 'homepage');
    expect(app?.startsWith(edges.find((edge) => edge.id === 'cf-gw')?.d ?? '!')).toBe(true);
    expect(app?.endsWith(`L ${homepage?.x} ${(homepage?.y ?? 0) + 27}`)).toBe(true);
    expect(platform?.startsWith(edges.find((edge) => edge.id === 'v-gw')?.d ?? '!')).toBe(true);
    expect(platform).toContain(`L ${WIDE_LAYOUT.trunk2} ${WIDE_LAYOUT.busY}`);
  });

  it('is null for services that are not on the map', () => {
    const { nodes, edges } = build(snapshot());
    expect(pulsePath('hwanstory', nodes, edges, WIDE_LAYOUT, false)).toBeNull();
    expect(pulsePath('gateway', nodes, edges, WIDE_LAYOUT, false)).toBeNull();
  });

  it('starts at the gateway on phones', () => {
    const { nodes, edges } = build(snapshot(), true);
    expect(pulsePath('homepage', nodes, edges, NARROW_LAYOUT, true)).toMatch(/^M \d+ \d+ L/);
  });
});

describe('edgeTouchesNode', () => {
  it('links branches to their service and trunks to the gateway', () => {
    expect(edgeTouchesNode('br-homepage', 'homepage')).toBe(true);
    expect(edgeTouchesNode('br-homepage', 'gateway')).toBe(false);
    expect(edgeTouchesNode('trunk1', 'gateway')).toBe(true);
    expect(edgeTouchesNode('unknown', 'gateway')).toBe(false);
  });
});
