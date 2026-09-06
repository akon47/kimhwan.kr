<template>
  <div class="about-container">
    <div class="content">
      <h3>Hi there, I'm Kim, Hwan 👋</h3>
      <br/>
      <div><strong>👨‍💻 Software Developer</strong></div>
      <br/>
      <div>I am always making something because I enjoy making things.</div>
    </div>
    <div class="github-stat">
      <img :src="githubStatsSrc" alt="GitHub stats"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '@/composables/useTheme';

const { isDarkTheme } = useTheme();

const githubStatsSrc = computed(
  () => `https://github-readme-stats.vercel.app/api?username=akon47&show_icons=true&theme=${isDarkTheme.value ? 'dark' : 'light'}`,
);
</script>

<style scoped>

.about-container > .content {
  padding: 0 5px;
}

.about-container > .github-stat {
  margin: 15px 0;
}

</style>
