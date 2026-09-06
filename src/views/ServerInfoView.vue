<template>
  <div class="server-info-container">
    <div class="server-info">
      <div class="title">
        <h4>
          📅 {{ serverSince }} ~ {{ now }}
        </h4>
      </div>
      <div class="content">
        <template v-for="spec in serverSpecs" :key="spec.key">
          <h5 :class="`${spec.key}-title`">
            {{ spec.title }}
          </h5>
          <template v-for="(line, index) in spec.lines" :key="line">
            <br v-if="index > 0"/>
            <span>{{ line }}</span>
          </template>
        </template>
        <h5 class="services-title">
          Running Services
        </h5>
        <div class="services">
          <div v-for="service in services" :key="service.name">
            <a v-if="service.url" :href="service.url" target="_blank">{{ service.name }}</a>
            <template v-else>{{ service.name }}</template>
          </div>
        </div>
      </div>
      <div class="images">
        <div v-for="photo in serverPhotos" :key="photo">
          <a :href="photo" target="_blank">
            <img :src="photo" alt="Server photo"/>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { serverPhotos, serverSince, serverSpecs, services } from '@/data/server';

const now = ref('');
let timerId: number | undefined;

function formatDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const ymd = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
  const hms = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${ymd} ${hms}`;
}

function updateNow() {
  now.value = formatDateTime(new Date());
}

onMounted(() => {
  updateNow();
  timerId = window.setInterval(updateNow, 500);
});

onUnmounted(() => {
  if (timerId !== undefined) {
    window.clearInterval(timerId);
    timerId = undefined;
  }
});
</script>

<style scoped>

.server-info-container {
  display: grid;

  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: repeat(2, auto);

  grid-row-gap: 20px;
}

.server-info {
  padding: 10px 20px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  box-sizing: border-box;

  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;

  align-items: start;
  align-content: start;
}

.server-info > .title {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
  margin-bottom: 10px;
  grid-column: 1 / span 2;
}

.server-info > .content {
  grid-column: 1 / span 1;
  min-width: 300px;
  max-width: 400px;
}

.server-info > .images {
  grid-column: 2 / span 1;
  border-left: 1px solid var(--border-color);
  height: 100%;
  margin-left: 10px;
  padding-left: 10px;
  box-sizing: border-box;
}

.images img {
  width: 200px;
}

@media (max-width: 720px) {
  .server-info > .images {
    display: none;
  }
}

.content > span {
  padding: 0 5px;
  font-size: 14px;
  line-height: 35px;
}

.content > .services {
  display: flex;
  flex-wrap: wrap;
  flex-basis: 0px;
  flex-shrink: 0;
  gap: 10px;
  font-size: 14px;
  margin-top: 10px;
}

.content > .services > div {
  padding: 2px 10px;
  border-radius: 5px;
  border: 1px solid var(--border-color);
}

.content h5 {
  display: flex;
  flex-direction: row;

  align-items: center;
}

.content h5::before {
  content: '';
  width: 16px;
  height: 16px;
  margin-right: 5px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.os-title::before {
  background-image: url('@/assets/cd.png');
}

.processor-title::before {
  background-image: url('@/assets/processor.svg');
}

.memory-title::before {
  background-image: url('@/assets/memory.png');
}

.ssd-title::before {
  background-image: url('@/assets/ssd.svg');
}

.ups-title::before {
  content: '🔋' !important;
  margin-left: -2px !important;
  margin-right: 7px !important;
  height: auto !important;
}

.services-title::before {
  background-image: url('@/assets/apps.svg');
}

</style>
