/** Geometry of the flow map: where every node sits, for the wide and the phone layout. */

export const NODE_HEIGHT = 54;

/** Services drawn in the two columns, top to bottom. Ones the API does not report are skipped. */
export const APP_ORDER = ['homepage', 'hwanstory', 'hwanscord', 'shootgame', 'screenshare', 'funcia', 'visit-counter', 'n8n'];
export const PLATFORM_ORDER = ['jenkins', 'elk', 'nas', 'vpn', 'proxmox'];

/** Services reached without Cloudflare in front. */
export const DIRECT_SERVICES: ReadonlySet<string> = new Set(['nas', 'proxmox', 'vpn']);

export interface Column {
  readonly x: number;
  readonly w: number;
  readonly top: number;
  readonly step: number;
}

export interface FlowLayout {
  readonly w: number;
  readonly h: number;
  /** Dashed box around everything inside the home network. */
  readonly home: { readonly x: number; readonly y: number; readonly w: number; readonly h: number };
  /** Headings of the two service columns. */
  readonly labels: readonly { readonly column: 'apps' | 'platform'; readonly x: number; readonly y: number }[];
  /** Fixed nodes by id. A node missing here is not drawn in this layout. */
  readonly pos: Readonly<Record<string, { readonly x: number; readonly y: number; readonly w: number }>>;
  readonly apps: Column;
  readonly platform: Column;
  /** X of the vertical trunk feeding each column. */
  readonly trunk1: number;
  readonly trunk2: number;
  /** Y of the horizontal bus joining the two trunks (wide layout only). */
  readonly busY: number;
}

/**
 * Wide: internet column on the left (visitor above Cloudflare, GitHub/Docker Hub below), home box with
 * the power row on top, gateway in the middle and two service columns on the right.
 */
export const WIDE_LAYOUT: FlowLayout = {
  w: 1140,
  h: 780,
  home: { x: 300, y: 20, w: 820, h: 740 },
  labels: [
    { column: 'apps', x: 645, y: 168 },
    { column: 'platform', x: 890, y: 168 },
  ],
  pos: {
    visitor: { x: 40, y: 250, w: 200 },
    cloudflare: { x: 40, y: 373, w: 200 },
    github: { x: 40, y: 610, w: 200 },
    dockerhub: { x: 40, y: 700, w: 200 },
    power: { x: 316, y: 76, w: 96 },
    ups: { x: 436, y: 76, w: 180 },
    host: { x: 700, y: 76, w: 400 },
    gateway: { x: 350, y: 373, w: 180 },
  },
  apps: { x: 645, w: 205, top: 180, step: 68 },
  platform: { x: 890, w: 210, top: 180, step: 68 },
  trunk1: 590,
  trunk2: 865,
  busY: 148,
};

/** Narrow (phones): internet on top, then the home box with power, host, gateway and one column of services. */
export const NARROW_LAYOUT: FlowLayout = (() => {
  const nodeX = 40;
  const nodeW = 370;
  const step = 64;
  const homeY = 186;
  const appsTop = 490;
  const platformTop = appsTop + APP_ORDER.length * step + 40;
  const bottom = platformTop + (PLATFORM_ORDER.length - 1) * step + NODE_HEIGHT + 16;
  return {
    w: 460,
    h: bottom + 12,
    home: { x: 20, y: homeY, w: 410, h: bottom - homeY },
    labels: [
      { column: 'apps', x: 80, y: appsTop - 12 },
      { column: 'platform', x: 80, y: platformTop - 12 },
    ],
    pos: {
      visitor: { x: nodeX, y: 20, w: nodeW },
      cloudflare: { x: nodeX, y: 106, w: nodeW },
      power: { x: nodeX, y: 234, w: 140 },
      ups: { x: 200, y: 234, w: 210 },
      host: { x: nodeX, y: 312, w: nodeW },
      gateway: { x: nodeX, y: 386, w: nodeW },
    },
    apps: { x: 80, w: 330, top: appsTop, step },
    platform: { x: 80, w: 330, top: platformTop, step },
    trunk1: 54,
    trunk2: 54,
    busY: 0,
  };
})();
