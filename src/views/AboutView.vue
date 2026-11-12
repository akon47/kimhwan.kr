<template>
  <div class="container about">
    <section class="profile">
      <img class="profile__avatar" :src="site.avatarUrl" :alt="site.name" width="112" height="112"/>
      <div class="profile__text">
        <p class="eyebrow">{{ t.about.eyebrow }}</p>
        <h1 class="profile__name">
          {{ site.name }} <span class="profile__name-ko">{{ site.nameKo }}</span>
        </h1>
        <p class="profile__role">{{ t.site.role }}</p>
        <p class="profile__bio">{{ t.site.tagline }}</p>
        <ul class="profile__links">
          <li v-for="link in socialLinks" :key="link.href">
            <a class="btn btn--sm" :href="link.href" target="_blank" rel="noopener">
              <AppIcon :name="link.icon" :size="14"/>
              {{ link.label }}
            </a>
          </li>
        </ul>
      </div>
    </section>

    <section class="block">
      <h2 class="block__title">{{ t.about.stackTitle }}</h2>
      <p class="block__note">{{ t.about.stackNote }}</p>
      <ul class="stack">
        <li v-for="item in stack" :key="item.tag" class="tag stack__item">
          {{ item.tag }}
          <span class="stack__count">{{ item.count }}</span>
        </li>
      </ul>
    </section>

    <section v-if="!statsFailed" class="block">
      <h2 class="block__title">GitHub</h2>
      <a :href="githubUrl" target="_blank" rel="noopener" class="stats">
        <img :src="githubStatsSrc" :alt="t.about.githubStats" loading="lazy" @error="statsFailed = true"/>
      </a>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { useTheme } from '@/composables/useTheme';
import { site, socialLinks } from '@/config/site';
import { tagUsage } from '@/data/projects';
import { useI18n } from '@/i18n';

const { isDark } = useTheme();
const { t } = useI18n();

const githubUrl = `https://github.com/${site.githubUser}`;

const githubStatsSrc = computed(() => {
  const params = new URLSearchParams({
    username: site.githubUser,
    show_icons: 'true',
    hide_border: 'true',
    bg_color: '00000000',
    theme: isDark.value ? 'dark' : 'default',
  });
  return `https://github-readme-stats.vercel.app/api?${params}`;
});

/** The stats image comes from a third-party service; the section is dropped if it does not load. */
const statsFailed = ref(false);

const stack = tagUsage().filter((item) => item.count > 1);
</script>

<style scoped>
.about {
  display: grid;
  gap: var(--space-12);
}

.profile {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-6) var(--space-8);
}

.profile__avatar {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: var(--color-surface-muted);
  box-shadow:
    0 0 0 1px var(--color-border),
    var(--shadow-md);
}

.profile__text {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}

.profile__name {
  font-size: var(--text-2xl);
}

.profile__name-ko {
  margin-left: var(--space-1);
  color: var(--color-text-subtle);
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
}

.profile__role {
  font-weight: var(--weight-semibold);
}

.profile__bio {
  color: var(--color-text-muted);
}

.profile__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.block {
  display: grid;
  gap: var(--space-3);
}

.block__title {
  font-size: var(--text-lg);
}

.block__note {
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}

.stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.stack__item {
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-sm);
}

.stack__count {
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
}

.stats {
  justify-self: start;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.stats img {
  width: 100%;
  max-width: 28rem;
}
</style>
