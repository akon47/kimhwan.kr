export interface Menu {
  readonly title: string;
  readonly summary: string;
  readonly to: string;
}

export const menus: Menu[] = [
  {
    title: '📡 Live Status',
    summary: 'Real-time health of every service running on my home server: uptime, host resources, UPS and backups.',
    to: '/status',
  },
  {
    title: '🚀 OpenSource Projects',
    summary: 'These are several projects that I personally developed and published on GitHub.',
    to: '/opensource-projects',
  },
  {
    title: '🖥︎ Server Info',
    summary: 'Information about the server used to operate the current site and various other services.',
    to: '/server-info',
  },
  {
    title: '👨‍💻 About Me',
    summary: 'about me?',
    to: '/about',
  },
];
