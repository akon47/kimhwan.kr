<template>
  <footer class="footer">
    <div class="container footer__inner">
      <div class="footer__meta">
        <p>© {{ site.sinceYear }}–{{ currentYear }} {{ site.nameKo }} ({{ site.name }})</p>
        <p class="footer__note">
          Self-hosted on a home server ·
          <a class="link" :href="site.repositoryUrl" target="_blank" rel="noopener">Source</a>
        </p>
      </div>

      <img class="footer__counter" :src="site.visitCounterUrl" alt="방문자 수" loading="lazy" height="20"/>

      <ul class="footer__socials">
        <li v-for="link in socialLinks" :key="link.href">
          <a
            class="btn btn--ghost btn--icon"
            :href="link.href"
            :aria-label="link.label"
            :title="link.label"
            target="_blank"
            rel="noopener"
          >
            <AppIcon :name="link.icon"/>
          </a>
        </li>
      </ul>
    </div>
  </footer>
</template>

<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue';
import { site, socialLinks } from '@/config/site';

const currentYear = new Date().getFullYear();
</script>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}

.footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4) var(--space-6);
  padding-block: var(--space-6);
}

.footer__meta {
  margin-right: auto;
}

.footer__note {
  font-size: var(--text-xs);
}

.footer__counter {
  height: 20px;
}

.footer__socials {
  display: flex;
  gap: var(--space-1);
}
</style>
