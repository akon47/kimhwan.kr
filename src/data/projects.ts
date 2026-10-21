export interface Project {
  readonly title: string;
  readonly summary: string;
  readonly githubUrls: string[];
  readonly demoUrl?: string;
  readonly tags: string[];
}

export const projects: Project[] = [
  {
    title: 'Claude Account Switcher',
    summary: 'A Windows system-tray app that switches between multiple Claude Code (CLI) accounts with one click and runs them concurrently in isolated sessions. Supports 14 UI languages and ships with an auto-updating installer, also available via winget.',
    githubUrls: ['https://github.com/akon47/claude-account-switcher-windows'],
    demoUrl: 'https://github.com/akon47/claude-account-switcher-windows/releases/latest',
    tags: ['C#', 'WPF', '.NET 9', 'Claude Code', 'System Tray', 'winget'],
  },
  {
    title: 'NvChat',
    summary: 'A Windows desktop app to chat with the free LLMs on build.nvidia.com. Streaming chat, saved conversations, live markdown/code rendering, reasoning display, image attachments and in-app auto-update, shipped as a single .exe.',
    githubUrls: ['https://github.com/akon47/NvChat'],
    demoUrl: 'https://github.com/akon47/NvChat/releases/latest',
    tags: ['C#', 'WPF', '.NET 8', 'LLM', 'NVIDIA NIM'],
  },
  {
    title: 'NetThrottle',
    summary: 'A Windows desktop app that rate-limits per-process network bandwidth, with separate download and upload caps for each application. Traffic is shaped at the network layer using WinDivert, delaying packets instead of dropping them.',
    githubUrls: ['https://github.com/akon47/NetThrottle'],
    demoUrl: 'https://github.com/akon47/NetThrottle/releases/latest',
    tags: ['C#', 'WPF', '.NET 9', 'WinDivert', 'Network'],
  },
  {
    title: "Hwan'Story",
    summary: 'Blog Service Frontend/Backend Project.',
    githubUrls: ['https://github.com/akon47/hwanstory', 'https://github.com/akon47/hwans-api-server'],
    demoUrl: 'https://hwanstory.kr/',
    tags: ['Vue3', 'Spring Framework', 'Docker', 'MySQL', 'Redis', 'Jenkins', 'REST API'],
  },
  {
    title: 'Hwanscord',
    summary: 'The hwanscord project is a Discord-like toy project. It has chatting, voice chat, and screen sharing functions between logged in users.',
    githubUrls: ['https://github.com/akon47/hwanscord-frontend', 'https://github.com/akon47/hwanscord-backend'],
    demoUrl: 'https://hwanscord.kimhwan.kr/',
    tags: ['Vue3', 'NodeJS', 'WebSocket', 'WebRTC', 'MongoDB', 'Docker', 'Docker-Compose'],
  },
  {
    title: 'ShootGame',
    summary: 'Can I make a game using Canvas in HTML5? A web game project I created out of curiosity. You can play multi-play games with multiple people using a web socket.',
    githubUrls: ['https://github.com/akon47/shoot_game', 'https://github.com/akon47/shoot_game_server'],
    demoUrl: 'https://shootgame.kimhwan.kr/',
    tags: ['HTML5', 'Canvas', 'JavaScript', 'NodeJS', 'WebSocket', 'Game'],
  },
  {
    title: 'VisitCounter',
    summary: 'The visit-counter project was created because I wanted to count the number of visitors to a specific page. There is an open source project called hits, but there is a problem that the hits value continuously increases when refreshed because there is no handling of duplicate IPs, so I created it myself.',
    githubUrls: ['https://github.com/akon47/visit-counter'],
    demoUrl: 'https://counter.kimhwan.kr/',
    tags: ['TypeScript', 'Hono', 'SQLite', 'Docker', 'Jenkins'],
  },
  {
    title: 'Screen Share',
    summary: 'This is a project where you can easily share your screen.',
    githubUrls: ['https://github.com/akon47/screen-share', 'https://github.com/akon47/screen-share-server'],
    demoUrl: 'https://screenshare.kimhwan.kr/',
    tags: ['Vue3', 'Spring Framework', 'WebSocket', 'WebRTC', 'MySQL', 'Docker', 'Jenkins'],
  },
  {
    title: 'ScreenRecorder',
    summary: 'A simple recording program with the ability to record screens and audio on your computer. Supports H.264/H.265 hardware encoding (NVENC, QuickSync), region/window/display capture and hotkeys.',
    githubUrls: ['https://github.com/akon47/ScreenRecorder'],
    demoUrl: 'https://github.com/akon47/ScreenRecorder/releases/',
    tags: ['C#', 'WPF', 'FFMPEG', 'DirectX'],
  },
  {
    title: 'ToneGenerator',
    summary: 'A tone audio generation program that can be used in situations where testing of audio equipment or other constant audio signals are required.',
    githubUrls: ['https://github.com/akon47/ToneGenerator'],
    demoUrl: 'https://github.com/akon47/ToneGenerator/releases',
    tags: ['C#', 'WPF', 'Audio'],
  },
  {
    title: 'SimpleTCP',
    summary: 'A simple-to-use TCP server and client library.',
    githubUrls: ['https://github.com/akon47/SimpleTcp'],
    demoUrl: 'https://www.nuget.org/packages/SimpleTcpLib/',
    tags: ['C#', 'Nuget'],
  },
];
