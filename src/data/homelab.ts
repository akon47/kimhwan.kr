import type { IconName } from '@/components/ui/icons';
import type { Localized } from '@/i18n';

export interface HomelabFeature {
  readonly icon: IconName;
  readonly title: Localized;
  readonly summary: Localized;
}

/** How the home server that hosts this site is put together (shown on the home page). */
export const homelabFeatures: readonly HomelabFeature[] = [
  {
    icon: 'server',
    title: { en: 'Proxmox VE', ko: 'Proxmox VE' },
    summary: {
      en: 'One 12-thread, 94 GB machine at home runs every service in its own VM or LXC container.',
      ko: '12스레드·94 GB 서버 한 대가 집에서 모든 서비스를 각자의 VM 이나 LXC 컨테이너로 돌립니다.',
    },
  },
  {
    icon: 'globe',
    title: { en: 'Single nginx gateway', ko: 'nginx 관문 하나' },
    summary: {
      en: 'All public domains enter through one reverse proxy that terminates TLS with per-host certificates.',
      ko: '모든 공개 도메인은 리버스 프록시 하나로 들어오고, 여기서 호스트별 인증서로 TLS 를 종료합니다.',
    },
  },
  {
    icon: 'git-branch',
    title: { en: 'Push-to-deploy', ko: '푸시하면 배포' },
    summary: {
      en: 'A GitHub push triggers Jenkins, which builds a Docker image, pushes it to Docker Hub and rolls it out with Compose.',
      ko: 'GitHub 에 푸시하면 Jenkins 가 Docker 이미지를 빌드해 Docker Hub 에 올리고 Compose 로 배포합니다.',
    },
  },
  {
    icon: 'activity',
    title: { en: 'Observability', ko: '모니터링' },
    summary: {
      en: 'Gateway access logs flow into an ELK stack, and a small status API probes every service from inside the network.',
      ko: '관문 접속 로그는 ELK 스택으로 모이고, 작은 상태 API 가 내부망에서 모든 서비스를 직접 점검합니다.',
    },
  },
  {
    icon: 'shield',
    title: { en: 'Security monitoring', ko: '보안 모니터링' },
    summary: {
      en: 'CrowdSec blocks scanners at the gateway while Wazuh agents on every guest report logins, file changes and vulnerable packages.',
      ko: 'CrowdSec 이 관문에서 스캐너를 차단하고, 모든 게스트의 Wazuh 에이전트가 로그인·파일 변경·취약 패키지를 보고합니다.',
    },
  },
  {
    icon: 'zap',
    title: { en: 'Power & backups', ko: '전원 · 백업' },
    summary: {
      en: 'A UPS keeps the host up through short outages and shuts it down safely on long ones. Snapshots are taken every morning.',
      ko: 'UPS 가 짧은 정전 동안 호스트를 지키고 긴 정전에는 안전하게 종료합니다. 스냅샷 백업은 매일 아침 받습니다.',
    },
  },
];
