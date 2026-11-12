import type { IconName } from '@/components/ui/icons';
import type { Messages } from '@/i18n';

/**
 * Site-wide constants: identity, navigation and external links.
 * Texts that differ per language (role, tagline, menu labels) live in src/i18n.
 */
export const site = {
  name: 'Kim, Hwan',
  nameKo: '김환',
  avatarUrl: 'https://avatars.githubusercontent.com/u/49547202',
  githubUser: 'akon47',
  repositoryUrl: 'https://github.com/akon47/kimhwan.kr',
  visitCounterUrl: 'https://counter.kimhwan.kr?key=kimhwan.kr',
  sinceYear: 2022,
} as const;

export interface NavItem {
  /** Key of the label in the `nav` texts. */
  readonly key: keyof Messages['nav'];
  readonly to: string;
  readonly icon: IconName;
}

export const navItems: readonly NavItem[] = [
  { key: 'projects', to: '/projects', icon: 'code' },
  { key: 'status', to: '/status', icon: 'activity' },
  { key: 'guestbook', to: '/guestbook', icon: 'message' },
  { key: 'about', to: '/about', icon: 'user' },
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
