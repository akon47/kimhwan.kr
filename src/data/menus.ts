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
