<template>
  <!-- Names the other language, in that language, so it can be read by whoever needs it. -->
  <button
    type="button"
    class="btn btn--ghost btn--icon locale"
    :lang="other"
    :aria-label="t.language.switchTitle"
    :title="t.language.switchTitle"
    @click="toggleLocale"
  >
    {{ t.language.switchLabel }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/i18n';

/** Switches between Korean and English. The choice is remembered (see src/i18n). */
const { t, locale, toggleLocale } = useI18n();

const other = computed(() => (locale.value === 'ko' ? 'en' : 'ko'));
</script>

<style scoped>
.locale {
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: 0.04em;
}
</style>
