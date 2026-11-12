import type { IconName } from '@/components/ui/icons';

/** Site-wide constants: identity, navigation and external links. */
export const site = {
  name: 'Kim, Hwan',
  nameKo: '김환',
  role: 'Software Developer',
  tagline: 'I am always making something because I enjoy making things.',
  avatarUrl: 'https://avatars.githubusercontent.com/u/49547202',
  githubUser: 'akon47',
  repositoryUrl: 'https://github.com/akon47/kimhwan.kr',
  visitCounterUrl: 'https://counter.kimhwan.kr?key=kimhwan.kr',
  sinceYear: 2022,
} as const;

export interface NavItem {
  readonly label: string;
  readonly to: string;
}

export const navItems: readonly NavItem[] = [
  { label: 'Projects', to: '/projects' },
  { label: 'Status', to: '/status' },
  { label: 'Guestbook', to: '/guestbook' },
  { label: 'About', to: '/about' },
];

export interface SocialLink {
  readonly label: string;
  readonly href: string;
  readonly icon: IconName;
}

export const socialLinks: readonly SocialLink[] = [
  { label: 'GitHub', href: `https://github.com/${site.githubUser}`, icon: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hwankim92/', icon: 'linkedin' },
  { label: 'Email', href: 'mailto:akon47@naver.com', icon: 'mail' },
];
