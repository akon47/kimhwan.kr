<template>
  <div class="main-container">
    <menu-overview-item v-for="item in items" :key="item.title" :title="item.title" :summary="item.summary" :to="item.to"/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MenuOverviewItem from '@/components/MenuOverviewItem.vue';

interface MenuOverview {
  readonly title: String,
  readonly summary: String,
  readonly to: String,
}

export default defineComponent({
  name: 'MainView',
  components: { MenuOverviewItem },
  data() {
    return {
      items: [
        {
          title: '🚀 OpenSource Projects',
          summary: 'These are several projects that I personally developed and published on GitHub.',
          to: '/opensource-projects',
        },
        {
          title: '🖥 ServerInfo',
          summary: 'Information about the server used to operate the current site and various other services.',
          to: '/server-info',
        },
        {
          title: '🔍 About',
          summary: 'about me?',
          to: '/about',
        },
      ] as Array<MenuOverview>,
    };
  },
});
</script>

<style scoped>

.main-container {
  display: grid;

  grid-template-columns: 1fr;
  grid-auto-rows: auto;

  align-content: start;

  row-gap: 20px;

  width: 100%;
}

</style>