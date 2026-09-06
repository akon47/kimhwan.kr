export type ServerSpecKey = 'os' | 'processor' | 'memory' | 'ssd' | 'ups';

export interface ServerSpec {
  /** Used as the CSS class prefix for the section icon (e.g. `os-title`). */
  readonly key: ServerSpecKey;
  readonly title: string;
  readonly lines: string[];
}

export interface Service {
  readonly name: string;
  readonly url?: string;
}

export const serverSince = '2022.09';

export const serverSpecs: ServerSpec[] = [
  { key: 'os', title: 'OS', lines: ['Proxmox Virtual Environment 7.4'] },
  { key: 'processor', title: 'CPU', lines: ['INTEL Core i5-12400'] },
  { key: 'memory', title: 'MEMORY', lines: ['DDR4 16GB PC4-25600 x 2', 'DDR4 32GB PC4-25600 x 2'] },
  { key: 'ssd', title: 'STORAGE', lines: ['SAMSUNG 980 NVMe M.2 SSD 1 TB', 'Western Digital HDD 8 TB'] },
  { key: 'ups', title: 'UPS', lines: ['APC BX1200MI-GR'] },
];

export const services: Service[] = [
  { name: 'Kimhwan.kr', url: 'https://kimhwan.kr/' },
  { name: "Hwan'Story", url: 'https://blog.kimhwan.kr/' },
  { name: 'Hwanscord', url: 'https://hwanscord.kimhwan.kr/' },
  { name: 'ShootGame', url: 'https://shootgame.kimhwan.kr/' },
  { name: 'ScreenShare', url: 'https://screenshare.kimhwan.kr/' },
  { name: 'VisitCounter', url: 'https://github.com/akon47/visit-counter' },
  { name: 'Jenkins', url: 'https://build.kimhwan.kr/' },
  { name: 'Postfix' },
  { name: 'Nginx API Gateway' },
  { name: 'ELK-Stack', url: 'https://elk.kimhwan.kr/' },
];

export const serverPhotos: string[] = [
  'https://user-images.githubusercontent.com/49547202/189513989-ffb8d70e-af79-429a-abeb-da6c6a4235c2.png',
  'https://user-images.githubusercontent.com/49547202/213860127-a3647be9-e1b6-4633-8f08-7a3c9febeadb.png',
];
