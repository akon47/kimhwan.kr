export interface Menu {
  readonly title: string;
  readonly summary: string;
  readonly to: string;
}

export const menus: Menu[] = [
  {
    title: '🚀 OpenSource Projects',
    summary: 'These are several projects that I personally developed and published on GitHub.',
    to: '/opensource-projects',
  },
  {
    title: '🖥︎ Server Status',
    summary: 'Live health of every service on my home server: a flow map of traffic, power, deployments and logs, host resources, UPS and backups.',
    to: '/status',
  },
  {
    title: '👨‍💻 About Me',
    summary: 'about me?',
    to: '/about',
  },
];
