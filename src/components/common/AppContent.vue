<template>
  <div class="content-container">
    <div class="content-wrapper">
      <div v-show="title" class="title">
        {{ title }}
      </div>
      <router-view v-slot="{ Component }">
        <transition name="component-fade" mode="out-in">
          <component :is="Component" class="content-item"/>
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AppContent',
  computed: {
    title() {
      return this.$route.meta?.title;
    },
  },
});
</script>

<style scoped>

.content-container {
  display: grid;
  grid-template-columns: minmax(0, 1100px);
  grid-template-rows: auto 1fr;
  justify-content: center;
  box-sizing: border-box;
  padding: 20px;
}

.content-container > .content-wrapper {
  display: grid;
  justify-self: center;
  box-sizing: border-box;
  border-radius: 5px;
  min-width: 450px;
  padding: 40px;
  background: var(--content-background-color);
  box-shadow: 0 0 11px var(--base-shadow-color);
}

.content-wrapper > .title {
  justify-self: center;
  font-size: 30px;
  width: 100%;
  text-align: center;
  padding: 20px 20px 20px 20px;
  margin-bottom: 40px;
  border-bottom: 3px solid var(--border-color);
  box-sizing: border-box;
}

.content-wrapper > .content-item {
  justify-self: center;
  min-height: 400px;
}

.component-fade-enter-active,
.component-fade-leave-active {
  transition: opacity .2s ease;
}

.component-fade-enter-from,
.component-fade-leave-to {
  opacity: 0;
}
</style>