<template>
  <div class="overview-container">
    <div class="title">
      {{ menu.title }}
    </div>
    <div class="summary">
      {{ menu.summary }}
    </div>
    <router-link :to="menu.to">
      <button>Read More</button>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import type { Menu } from '@/data/menus';

defineProps<{
  menu: Menu;
}>();
</script>

<style scoped>

.overview-container {

  width: 100%;
  padding: 20px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  box-sizing: border-box;

  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: auto;
}

.overview-container > .title {
  font-size: 24px;
  font-weight: bold;
  border-bottom: 2px solid var(--border-color);
  box-sizing: border-box;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.overview-container > a {
  justify-self: end;
  align-self: end;
  margin-top: 20px;
  box-sizing: border-box;
}

</style>
