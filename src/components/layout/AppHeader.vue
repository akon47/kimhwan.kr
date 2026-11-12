<template>
  <header class="header">
    <div class="container header__inner">
      <RouterLink to="/" class="brand" :aria-label="`${site.name} 홈`">
        <img class="brand__avatar" :src="site.avatarUrl" alt="" width="30" height="30"/>
        <span class="brand__name">{{ site.name }}</span>
      </RouterLink>

      <nav class="nav" aria-label="주 메뉴">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav__link">
          {{ item.label }}
        </RouterLink>
      </nav>

      <PresenceBadge class="header__presence"/>
      <button
        type="button"
        class="btn btn--ghost btn--icon header__search"
        aria-label="빠른 이동 (Ctrl+K)"
        title="빠른 이동 (Ctrl+K)"
        @click="openPalette"
      >
        <AppIcon name="search"/>
      </button>
      <ThemeToggle/>
    </div>
  </header>
</template>

<script setup lang="ts">
import ThemeToggle from '@/components/layout/ThemeToggle.vue';
import PresenceBadge from '@/components/live/PresenceBadge.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import { useCommandPalette } from '@/composables/useCommandPalette';
import { navItems, site } from '@/config/site';

const { open: openPalette } = useCommandPalette();
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-header-bg);
  backdrop-filter: saturate(180%) blur(14px);
}

.header__inner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--header-height);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-right: auto;
  border-radius: var(--radius-full);
}

.brand__avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--color-surface-muted);
  box-shadow: 0 0 0 1px var(--color-border);
}

.brand__name {
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  letter-spacing: -0.02em;
}

.nav {
  display: flex;
  align-items: center;
  gap: 2px;
}

.nav__link {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition:
    color var(--duration-fast),
    background-color var(--duration-fast);
}

.nav__link:hover {
  color: var(--color-text);
}

.nav__link.router-link-active {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.header__presence {
  margin-inline: var(--space-2);
}

@media (max-width: 720px) {
  .brand__name,
  .header__presence,
  .header__search {
    display: none;
  }
}

@media (max-width: 480px) {
  .header__inner {
    gap: 0;
  }

  .nav__link {
    padding-inline: 6px;
    font-size: var(--text-xs);
  }
}
</style>
