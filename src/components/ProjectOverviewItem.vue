<template>
  <div class="overview-container">
    <div class="title">
      <a v-if="demoUrl" :href="demoUrl" target="_blank">{{ title }}</a>
      <span v-else>{{ title }}</span>
    </div>
    <div class="summary">
      {{ summary }}
    </div>
    <div class="githubs">
      <div class="github-item" v-for="githubUrl in githubUrls" :key="githubUrl">
        <a :href="githubUrl" target="_blank">
          <img :src="githubIconSrc"/>
          <span>{{ githubUrl }}</span>
        </a>
      </div>
    </div>
    <div class="tags">
      <div class="tag-item" v-for="tag in tags" :key="tag">
        {{ tag }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import store from '@/store';

export default defineComponent({
  name: 'ProjectOverviewItem',
  props: {
    title: {
      type: String,
    },
    summary: {
      type: String,
    },
    githubUrls: {
      type: Array,
    },
    demoUrl: {
      type: String,
      require: false,
    },
    tags: {
      type: Array,
    },
  },
  computed: {
    githubIconSrc() {
      if (store.getters['commonStore/isDarkTheme']) {
        return require('@/assets/github-dark.svg');
      } else {
        return require('@/assets/github-light.svg');
      }
    },
  },
});
</script>

<style scoped>

.overview-container {
  width: 100%;
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  box-sizing: border-box;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto auto;

  align-items: start;
}

.overview-container > .title {
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 5px;
  margin-bottom: 5px;
}

.overview-container > .summary {
  font-size: 14px;
  align-self: start;
  margin-bottom: 10px;
}

.overview-container > .tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 5px;
  align-self: end;
}

.tags > .tag-item {
  font-size: 12px;
  background: #218bff;
  border-radius: 5px;
  padding: 1px 5px;
  color: white;
  -ms-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
}

.overview-container > .githubs {
  display: flex;
  flex-direction: column;
  gap: 5px;
  box-sizing: border-box;
  margin: 5px 0;
}

.githubs > .github-item > a {
  display: flex;
  font-size: 14px;
}

.github-item img {
  border-radius: 100%;
  width: 20px;
  height: 20px;
}

.github-item span {
  align-self: center;
  margin-left: 5px;
}

</style>