import type { IconName } from '@/components/ui/icons';

export interface HomelabFeature {
  readonly icon: IconName;
  readonly title: string;
  readonly summary: string;
}

/** How the home server that hosts this site is put together (shown on the home page). */
export const homelabFeatures: readonly HomelabFeature[] = [
  {
    icon: 'server',
    title: 'Proxmox VE',
    summary: 'One 12-thread, 94 GB machine at home runs every service in its own VM or LXC container.',
  },
  {
    icon: 'globe',
    title: 'Single nginx gateway',
    summary: 'All public domains enter through one reverse proxy that terminates TLS with per-host certificates.',
  },
  {
    icon: 'git-branch',
    title: 'Push-to-deploy',
    summary: 'A GitHub push triggers Jenkins, which builds a Docker image, pushes it to Docker Hub and rolls it out with Compose.',
  },
  {
    icon: 'activity',
    title: 'Observability',
    summary: 'Gateway access logs flow into an ELK stack, and a small status API probes every service from inside the network.',
  },
  {
    icon: 'shield',
    title: 'Security monitoring',
    summary: 'CrowdSec blocks scanners at the gateway while Wazuh agents on every guest report logins, file changes and vulnerable packages.',
  },
  {
    icon: 'zap',
    title: 'Power & backups',
    summary: 'A UPS keeps the host up through short outages and shuts it down safely on long ones. Snapshots are taken every morning.',
  },
];
