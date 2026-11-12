import type { Localized, Messages } from '@/i18n';

export type ProjectKind = 'desktop' | 'web' | 'library';

export interface ProjectLink {
  /** Key of the button label in the `projects.links` texts. */
  readonly kind: keyof Messages['projects']['links'];
  readonly url: string;
}

export interface Project {
  readonly title: string;
  readonly summary: Localized;
  readonly kind: ProjectKind;
  /** Where a visitor can try it: a live site, a download page or a package registry. */
  readonly primaryLink?: ProjectLink;
  readonly githubUrls: readonly string[];
  readonly tags: readonly string[];
}

/** In the order the filter buttons are shown. Labels are in the `projects.kinds` texts. */
export const projectKinds: readonly ProjectKind[] = ['desktop', 'web', 'library'];

/** Newest first. The first few are shown on the home page. */
export const projects: readonly Project[] = [
  {
    title: 'Claude Account Switcher',
    summary: {
      en: 'A Windows system-tray app that switches between multiple Claude Code (CLI) accounts with one click and runs them concurrently in isolated sessions. Supports 14 UI languages and ships with an auto-updating installer, also available via winget.',
      ko: '여러 Claude Code(CLI) 계정을 클릭 한 번으로 전환하고, 세션을 분리해 동시에 실행할 수 있는 Windows 트레이 앱입니다. UI 는 14개 언어를 지원하고, 자동 업데이트되는 설치 파일과 winget 으로 배포합니다.',
    },
    kind: 'desktop',
    primaryLink: { kind: 'download', url: 'https://github.com/akon47/claude-account-switcher-windows/releases/latest' },
    githubUrls: ['https://github.com/akon47/claude-account-switcher-windows'],
    tags: ['C#', 'WPF', '.NET 9', 'Claude Code', 'System Tray', 'winget'],
  },
  {
    title: 'NvChat',
    summary: {
      en: 'A Windows desktop app to chat with the free LLMs on build.nvidia.com. Streaming chat, saved conversations, live markdown/code rendering, reasoning display, image attachments and in-app auto-update, shipped as a single .exe.',
      ko: 'build.nvidia.com 의 무료 LLM 과 대화하는 Windows 데스크톱 앱입니다. 스트리밍 채팅, 대화 저장, 실시간 마크다운·코드 렌더링, 추론 과정 표시, 이미지 첨부, 앱 내 자동 업데이트를 지원하고, .exe 파일 하나로 배포합니다.',
    },
    kind: 'desktop',
    primaryLink: { kind: 'download', url: 'https://github.com/akon47/NvChat/releases/latest' },
    githubUrls: ['https://github.com/akon47/NvChat'],
    tags: ['C#', 'WPF', '.NET 8', 'LLM', 'NVIDIA NIM'],
  },
  {
    title: 'NetThrottle',
    summary: {
      en: 'A Windows desktop app that rate-limits per-process network bandwidth, with separate download and upload caps for each application. Traffic is shaped at the network layer using WinDivert, delaying packets instead of dropping them.',
      ko: '프로세스별로 네트워크 대역폭을 제한하는 Windows 데스크톱 앱입니다. 앱마다 다운로드·업로드 한도를 따로 걸 수 있고, WinDivert 로 네트워크 계층에서 패킷을 버리지 않고 지연시켜 속도를 조절합니다.',
    },
    kind: 'desktop',
    primaryLink: { kind: 'download', url: 'https://github.com/akon47/NetThrottle/releases/latest' },
    githubUrls: ['https://github.com/akon47/NetThrottle'],
    tags: ['C#', 'WPF', '.NET 9', 'WinDivert', 'Network'],
  },
  {
    title: "Hwan'Story",
    summary: {
      en: 'Blog Service Frontend/Backend Project.',
      ko: '블로그 서비스 프론트엔드·백엔드 프로젝트입니다.',
    },
    kind: 'web',
    primaryLink: { kind: 'visit', url: 'https://hwanstory.kr/' },
    githubUrls: ['https://github.com/akon47/hwanstory', 'https://github.com/akon47/hwans-api-server'],
    tags: ['Vue3', 'Spring Framework', 'Docker', 'MySQL', 'Redis', 'Jenkins', 'REST API'],
  },
  {
    title: 'Hwanscord',
    summary: {
      en: 'The hwanscord project is a Discord-like toy project. It has chatting, voice chat, and screen sharing functions between logged in users.',
      ko: '디스코드를 본떠 만든 토이 프로젝트입니다. 로그인한 사용자끼리 채팅, 음성 대화, 화면 공유를 할 수 있습니다.',
    },
    kind: 'web',
    primaryLink: { kind: 'visit', url: 'https://hwanscord.kimhwan.kr/' },
    githubUrls: ['https://github.com/akon47/hwanscord-frontend', 'https://github.com/akon47/hwanscord-backend'],
    tags: ['Vue3', 'NodeJS', 'WebSocket', 'WebRTC', 'MongoDB', 'Docker', 'Docker-Compose'],
  },
  {
    title: 'ShootGame',
    summary: {
      en: 'Can I make a game using Canvas in HTML5? A web game project I created out of curiosity. You can play multi-play games with multiple people using a web socket.',
      ko: 'HTML5 Canvas 로 게임을 만들 수 있을까? 하는 호기심에서 만든 웹 게임입니다. 웹소켓으로 여러 명이 함께 즐기는 멀티플레이를 지원합니다.',
    },
    kind: 'web',
    primaryLink: { kind: 'play', url: 'https://shootgame.kimhwan.kr/' },
    githubUrls: ['https://github.com/akon47/shoot_game', 'https://github.com/akon47/shoot_game_server'],
    tags: ['HTML5', 'Canvas', 'JavaScript', 'NodeJS', 'WebSocket', 'Game'],
  },
  {
    title: 'VisitCounter',
    summary: {
      en: 'The visit-counter project was created because I wanted to count the number of visitors to a specific page. There is an open source project called hits, but there is a problem that the hits value continuously increases when refreshed because there is no handling of duplicate IPs, so I created it myself.',
      ko: '특정 페이지의 방문자 수를 세고 싶어서 만든 프로젝트입니다. hits 라는 오픈소스가 있지만 중복 IP 처리가 없어 새로고침할 때마다 숫자가 올라가서 직접 만들었습니다.',
    },
    kind: 'web',
    primaryLink: { kind: 'visit', url: 'https://counter.kimhwan.kr/' },
    githubUrls: ['https://github.com/akon47/visit-counter'],
    tags: ['TypeScript', 'Hono', 'SQLite', 'Docker', 'Jenkins'],
  },
  {
    title: 'Screen Share',
    summary: {
      en: 'This is a project where you can easily share your screen.',
      ko: '브라우저에서 화면을 간편하게 공유하는 서비스입니다.',
    },
    kind: 'web',
    primaryLink: { kind: 'visit', url: 'https://screenshare.kimhwan.kr/' },
    githubUrls: ['https://github.com/akon47/screen-share', 'https://github.com/akon47/screen-share-server'],
    tags: ['Vue3', 'Spring Framework', 'WebSocket', 'WebRTC', 'MySQL', 'Docker', 'Jenkins'],
  },
  {
    title: 'ScreenRecorder',
    summary: {
      en: 'A simple recording program with the ability to record screens and audio on your computer. Supports H.264/H.265 hardware encoding (NVENC, QuickSync), region/window/display capture and hotkeys.',
      ko: '컴퓨터 화면과 소리를 녹화하는 간단한 프로그램입니다. H.264/H.265 하드웨어 인코딩(NVENC, QuickSync), 영역·창·디스플레이 캡처와 단축키를 지원합니다.',
    },
    kind: 'desktop',
    primaryLink: { kind: 'download', url: 'https://github.com/akon47/ScreenRecorder/releases/' },
    githubUrls: ['https://github.com/akon47/ScreenRecorder'],
    tags: ['C#', 'WPF', 'FFMPEG', 'DirectX'],
  },
  {
    title: 'ToneGenerator',
    summary: {
      en: 'A tone audio generation program that can be used in situations where testing of audio equipment or other constant audio signals are required.',
      ko: '오디오 장비를 테스트하거나 일정한 신호음이 필요할 때 쓰는 톤 발생기입니다.',
    },
    kind: 'desktop',
    primaryLink: { kind: 'download', url: 'https://github.com/akon47/ToneGenerator/releases' },
    githubUrls: ['https://github.com/akon47/ToneGenerator'],
    tags: ['C#', 'WPF', 'Audio'],
  },
  {
    title: 'SimpleTCP',
    summary: {
      en: 'A simple-to-use TCP server and client library.',
      ko: '간단하게 쓸 수 있는 TCP 서버·클라이언트 라이브러리입니다.',
    },
    kind: 'library',
    primaryLink: { kind: 'nuget', url: 'https://www.nuget.org/packages/SimpleTcpLib/' },
    githubUrls: ['https://github.com/akon47/SimpleTcp'],
    tags: ['C#', 'Nuget'],
  },
];

/** Tags ordered by how many projects use them (ties keep first-seen order). */
export function tagUsage(list: readonly Project[] = projects): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const project of list) {
    for (const tag of project.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}
