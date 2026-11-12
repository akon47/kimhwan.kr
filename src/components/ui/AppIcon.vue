<template>
  <!-- eslint-disable vue/no-v-html -- icon bodies are static strings from icons.ts -->
  <svg
    class="icon"
    :class="{ 'icon--solid': definition.solid }"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    aria-hidden="true"
    focusable="false"
    v-html="definition.body"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { iconDefinition, type IconName } from './icons';

const props = withDefaults(
  defineProps<{
    name: IconName;
    /** Rendered size in px. */
    size?: number;
  }>(),
  { size: 18 },
);

const definition = computed(() => iconDefinition(props.name));
</script>

<style scoped>
.icon {
  display: inline-block;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon--solid {
  fill: currentColor;
  stroke: none;
}
</style>
