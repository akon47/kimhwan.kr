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
      <img v-if="isDarkTheme" src="https://github-readme-stats-git-masterrstaa-rickstaa.vercel.app/api?username=akon47&show_icons=true&theme=dark" />
      <img v-else src="https://github-readme-stats-git-masterrstaa-rickstaa.vercel.app/api?username=akon47&show_icons=true&theme=light" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';

export default defineComponent({
  name: 'AboutView',
  computed: {
    isDarkTheme() {
      return store.getters['commonStore/isDarkTheme'];
    }
  },
});
</script>

<style scoped>

.about-container > .content {
  padding: 0 5px;
}

.about-container > .github-stat {
  margin: 15px 0;
}

</style>
