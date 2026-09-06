<template>
  <div class="main-container">
    <MenuOverviewItem v-for="menu in menus" :key="menu.to" :menu="menu"/>
  </div>
</template>

<script setup lang="ts">
import MenuOverviewItem from '@/components/MenuOverviewItem.vue';
import { menus } from '@/data/menus';
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
