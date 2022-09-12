<template>
  <div class="about-container">
    <div class="content">
      Hello!! I'm Kim,Hwan 👋
    </div>
    <div class="github-stat">
      <img v-if="isDarkTheme" src="https://github-readme-stats.vercel.app/api?username=akon47&&show_icons=true&theme=dark" />
      <img v-else src="https://github-readme-stats.vercel.app/api?username=akon47&&show_icons=true&theme=light" />
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
  margin: 10px 0;
}

</style>