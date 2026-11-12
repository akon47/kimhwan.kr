export type ProjectKind = 'desktop' | 'web' | 'library';

export interface ProjectLink {
  readonly label: string;
  readonly url: string;
}

export interface Project {
  readonly title: string;
  readonly summary: string;
  readonly kind: ProjectKind;
  /** Where a visitor can try it: a live site, a download page or a package registry. */
  readonly primaryLink?: ProjectLink;
  readonly githubUrls: readonly string[];
  readonly tags: readonly string[];
}

export const projectKindLabels: Record<ProjectKind, string> = {
  desktop: 'Desktop',
  web: 'Web',
  library: 'Library',
};

/** Newest first. The first few are shown on the home page. */
export const projects: readonly Project[] = [
  {
    title: 'Claude Account Switcher',
    summary:
      'A Windows system-tray app that switches between multiple Claude Code (CLI) accounts with one click and runs them concurrently in isolated sessions. Supports 14 UI languages and ships with an auto-updating installer, also available via winget.',
    kind: 'desktop',
    primaryLink: { label: 'Download', url: 'https://github.com/akon47/claude-account-switcher-windows/releases/latest' },
    githubUrls: ['https://github.com/akon47/claude-account-switcher-windows'],
    tags: ['C#', 'WPF', '.NET 9', 'Claude Code', 'System Tray', 'winget'],
  },
  {
    title: 'NvChat',
    summary:
      'A Windows desktop app to chat with the free LLMs on build.nvidia.com. Streaming chat, saved conversations, live markdown/code rendering, reasoning display, image attachments and in-app auto-update, shipped as a single .exe.',
    kind: 'desktop',
    primaryLink: { label: 'Download', url: 'https://github.com/akon47/NvChat/releases/latest' },
    githubUrls: ['https://github.com/akon47/NvChat'],
    tags: ['C#', 'WPF', '.NET 8', 'LLM', 'NVIDIA NIM'],
  },
  {
    title: 'NetThrottle',
    summary:
      'A Windows desktop app that rate-limits per-process network bandwidth, with separate download and upload caps for each application. Traffic is shaped at the network layer using WinDivert, delaying packets instead of dropping them.',
    kind: 'desktop',
    primaryLink: { label: 'Download', url: 'https://github.com/akon47/NetThrottle/releases/latest' },
    githubUrls: ['https://github.com/akon47/NetThrottle'],
    tags: ['C#', 'WPF', '.NET 9', 'WinDivert', 'Network'],
  },
  {
    title: "Hwan'Story",
    summary: 'Blog Service Frontend/Backend Project.',
    kind: 'web',
    primaryLink: { label: 'Visit', url: 'https://hwanstory.kr/' },
    githubUrls: ['https://github.com/akon47/hwanstory', 'https://github.com/akon47/hwans-api-server'],
    tags: ['Vue3', 'Spring Framework', 'Docker', 'MySQL', 'Redis', 'Jenkins', 'REST API'],
  },
  {
    title: 'Hwanscord',
    summary:
      'The hwanscord project is a Discord-like toy project. It has chatting, voice chat, and screen sharing functions between logged in users.',
    kind: 'web',
    primaryLink: { label: 'Visit', url: 'https://hwanscord.kimhwan.kr/' },
    githubUrls: ['https://github.com/akon47/hwanscord-frontend', 'https://github.com/akon47/hwanscord-backend'],
    tags: ['Vue3', 'NodeJS', 'WebSocket', 'WebRTC', 'MongoDB', 'Docker', 'Docker-Compose'],
  },
  {
    title: 'ShootGame',
    summary:
      'Can I make a game using Canvas in HTML5? A web game project I created out of curiosity. You can play multi-play games with multiple people using a web socket.',
    kind: 'web',
    primaryLink: { label: 'Play', url: 'https://shootgame.kimhwan.kr/' },
    githubUrls: ['https://github.com/akon47/shoot_game', 'https://github.com/akon47/shoot_game_server'],
    tags: ['HTML5', 'Canvas', 'JavaScript', 'NodeJS', 'WebSocket', 'Game'],
  },
  {
    title: 'VisitCounter',
    summary:
      'The visit-counter project was created because I wanted to count the number of visitors to a specific page. There is an open source project called hits, but there is a problem that the hits value continuously increases when refreshed because there is no handling of duplicate IPs, so I created it myself.',
    kind: 'web',
    primaryLink: { label: 'Visit', url: 'https://counter.kimhwan.kr/' },
    githubUrls: ['https://github.com/akon47/visit-counter'],
    tags: ['TypeScript', 'Hono', 'SQLite', 'Docker', 'Jenkins'],
  },
  {
    title: 'Screen Share',
    summary: 'This is a project where you can easily share your screen.',
    kind: 'web',
    primaryLink: { label: 'Visit', url: 'https://screenshare.kimhwan.kr/' },
    githubUrls: ['https://github.com/akon47/screen-share', 'https://github.com/akon47/screen-share-server'],
    tags: ['Vue3', 'Spring Framework', 'WebSocket', 'WebRTC', 'MySQL', 'Docker', 'Jenkins'],
  },
  {
    title: 'ScreenRecorder',
    summary:
      'A simple recording program with the ability to record screens and audio on your computer. Supports H.264/H.265 hardware encoding (NVENC, QuickSync), region/window/display capture and hotkeys.',
    kind: 'desktop',
    primaryLink: { label: 'Download', url: 'https://github.com/akon47/ScreenRecorder/releases/' },
    githubUrls: ['https://github.com/akon47/ScreenRecorder'],
    tags: ['C#', 'WPF', 'FFMPEG', 'DirectX'],
  },
  {
    title: 'ToneGenerator',
    summary:
      'A tone audio generation program that can be used in situations where testing of audio equipment or other constant audio signals are required.',
    kind: 'desktop',
    primaryLink: { label: 'Download', url: 'https://github.com/akon47/ToneGenerator/releases' },
    githubUrls: ['https://github.com/akon47/ToneGenerator'],
    tags: ['C#', 'WPF', 'Audio'],
  },
  {
    title: 'SimpleTCP',
    summary: 'A simple-to-use TCP server and client library.',
    kind: 'library',
    primaryLink: { label: 'NuGet', url: 'https://www.nuget.org/packages/SimpleTcpLib/' },
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
