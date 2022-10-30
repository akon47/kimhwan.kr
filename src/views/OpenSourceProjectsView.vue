<template>
  <div class="projects-container">
    <project-overview-item v-for="item in items" :key="item.githubUrl"
                           :title="item.title" :summary="item.summary" :githubUrls="item.githubUrls"
                           :demoUrl="item.demoUrl" :tags="item.tags"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ProjectOverviewItem from '@/components/ProjectOverviewItem.vue';

interface ProjectOverview {
  readonly title: String,
  readonly summary: String,
  readonly githubUrls: Array<String>,
  readonly demoUrl: String | undefined,
  readonly tags: Array<String>,
}

export default defineComponent({
  name: 'OpenSourceProjectsView',
  components: { ProjectOverviewItem },
  data() {
    return {
      items: [
        {
          title: 'Hwan\'Story',
          summary: 'Blog Service Frontend/Backend Project.',
          githubUrls: ['https://github.com/akon47/hwanstory', 'https://github.com/akon47/hwans-api-server'],
          demoUrl: 'https://blog.kimhwan.kr/',
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
          tags: ['NodeJS', 'MongoDB', 'Docker'],
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
          summary: 'It is a simple recording program with the ability to record the screen.',
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
      ] as Array<ProjectOverview>,
    };
  },
});
</script>

<style scoped>

.projects-container {
  display: grid;

  grid-template-columns: repeat(2, minmax(300px, auto));
  grid-auto-rows: auto;

  gap: 20px;
}

@media (max-width: 930px) {
  .projects-container {
    grid-template-columns: minmax(0, auto)
  }
}

</style>