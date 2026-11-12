<template>
  <Teleport to="body">
    <Transition name="palette">
      <div v-if="isOpen" class="backdrop" @click.self="close">
        <div class="palette" role="dialog" aria-modal="true" :aria-label="t.palette.label">
          <div class="palette__search">
            <AppIcon name="search" :size="16"/>
            <input
              ref="input"
              v-model="query"
              class="palette__input"
              type="text"
              :placeholder="t.palette.placeholder"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-list"
              :aria-activedescendant="active ? `command-${active.id}` : undefined"
              autocomplete="off"
              spellcheck="false"
              @keydown="onKeydown"
            >
            <kbd class="palette__key">Esc</kbd>
          </div>

          <ul id="command-list" ref="list" class="palette__list" role="listbox">
            <template v-for="group in groups" :key="group.title">
              <li class="palette__group" role="presentation">{{ group.title }}</li>
              <li
                v-for="command in group.commands"
                :id="`command-${command.id}`"
                :key="command.id"
                class="command"
                :class="{ 'command--active': command.id === active?.id }"
                role="option"
                :aria-selected="command.id === active?.id"
                @click="run(command)"
                @pointermove="activeId = command.id"
              >
                <AppIcon :name="command.icon" :size="16" class="command__icon"/>
                <span class="command__label">{{ command.label }}</span>
                <span v-if="command.hint" class="command__hint">{{ command.hint }}</span>
              </li>
            </template>
            <li v-if="!matches.length" class="palette__empty" role="presentation">{{ t.palette.empty(query) }}</li>
          </ul>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '@/components/ui/AppIcon.vue';
import type { IconName } from '@/components/ui/icons';
import { useCommandPalette } from '@/composables/useCommandPalette';
import { useTheme } from '@/composables/useTheme';
import { navItems, socialLinks } from '@/config/site';
import { projects } from '@/data/projects';
import { useI18n } from '@/i18n';

/**
 * Keyboard launcher: Ctrl+K (⌘K) opens it anywhere; type to filter, ↑/↓ to move, Enter to go.
 * Lists the pages, every project and the external links, plus a few actions (theme, language).
 */
interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: IconName;
  /** Extra text the query is matched against. */
  keywords?: string;
  run: () => void;
}

const { isOpen, close, toggle } = useCommandPalette();
const { isDark, toggleTheme } = useTheme();
const { t, toggleLocale } = useI18n();
const router = useRouter();

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener');
}

const commands = computed<Command[]>(() => {
  const { palette, nav, projects: projectTexts, theme, language } = t.value;
  return [
    {
      id: 'page-home',
      group: palette.groups.pages,
      label: nav.home,
      icon: 'home',
      keywords: palette.homeKeywords,
      run: () => void router.push('/'),
    },
    ...navItems.map<Command>((item) => ({
      id: `page-${item.to}`,
      group: palette.groups.pages,
      label: nav[item.key],
      icon: item.icon,
      // the address is the same in every language, so "status" finds the page whatever the menu says
      keywords: item.to,
      run: () => void router.push(item.to),
    })),
    ...projects.map<Command>((project) => ({
      id: `project-${project.title}`,
      group: palette.groups.projects,
      label: project.title,
      hint: project.primaryLink ? projectTexts.links[project.primaryLink.kind] : 'GitHub',
      icon: 'arrow-up-right',
      keywords: `${projectTexts.kinds[project.kind]} ${project.kind} ${project.tags.join(' ')}`,
      run: () => openExternal(project.primaryLink?.url ?? project.githubUrls[0] ?? '/projects'),
    })),
    ...socialLinks.map<Command>((link) => ({
      id: `link-${link.label}`,
      group: palette.groups.links,
      label: link.label,
      icon: link.icon,
      run: () => openExternal(link.href),
    })),
    {
      id: 'action-theme',
      group: palette.groups.actions,
      label: isDark.value ? theme.toLight : theme.toDark,
      icon: isDark.value ? 'sun' : 'moon',
      keywords: palette.themeKeywords,
      run: toggleTheme,
    },
    {
      id: 'action-language',
      group: palette.groups.actions,
      label: language.switchTitle,
      icon: 'languages',
      keywords: palette.languageKeywords,
      run: toggleLocale,
    },
  ];
});

/* ----- filtering ----- */
const query = ref('');

const matches = computed(() => {
  const words = query.value.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return commands.value;
  }
  return commands.value.filter((command) => {
    const haystack = `${command.label} ${command.group} ${command.keywords ?? ''}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
});

const groups = computed(() => {
  const byGroup = new Map<string, Command[]>();
  for (const command of matches.value) {
    byGroup.set(command.group, [...(byGroup.get(command.group) ?? []), command]);
  }
  return [...byGroup].map(([title, list]) => ({ title, commands: list }));
});

/* ----- selection ----- */
const activeId = ref<string | null>(null);
const active = computed(() => matches.value.find((command) => command.id === activeId.value) ?? matches.value[0]);
const list = useTemplateRef<HTMLElement>('list');
const input = useTemplateRef<HTMLInputElement>('input');

watch(query, () => (activeId.value = null));

function move(step: number) {
  const items = matches.value;
  if (!items.length) {
    return;
  }
  const index = active.value ? items.indexOf(active.value) : -1;
  const next = items[(index + step + items.length) % items.length];
  activeId.value = next?.id ?? null;
  void nextTick(() => list.value?.querySelector('.command--active')?.scrollIntoView({ block: 'nearest' }));
}

function run(command: Command) {
  close();
  command.run();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    move(1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    move(-1);
  } else if (event.key === 'Enter' && !event.isComposing && active.value) {
    event.preventDefault();
    run(active.value);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    close();
  }
}

/* ----- open / close ----- */
let previousFocus: Element | null = null;

watch(isOpen, (open) => {
  if (open) {
    previousFocus = document.activeElement;
    query.value = '';
    activeId.value = null;
    void nextTick(() => input.value?.focus());
  } else if (previousFocus instanceof HTMLElement) {
    previousFocus.focus();
  }
});

function onGlobalKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    toggle();
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown));
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown));
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-dialog);
  display: grid;
  align-items: start;
  justify-items: center;
  padding: 12vh var(--space-4) var(--space-4);
  background: var(--color-backdrop);
  backdrop-filter: blur(3px);
}

.palette {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(36rem, 100%);
  max-height: min(28rem, 70dvh);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.palette__search {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-subtle);
}

.palette__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: none;
  color: var(--color-text);
  font-size: var(--text-md);
}

.palette__input::placeholder {
  color: var(--color-text-subtle);
}

.palette__key {
  padding: 1px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: var(--text-2xs);
}

.palette__list {
  padding: var(--space-2);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.palette__group {
  padding: var(--space-2) var(--space-3) var(--space-1);
  color: var(--color-text-subtle);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.06em;
}

.palette__empty {
  padding: var(--space-6) var(--space-3);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  text-align: center;
}

.command {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  cursor: pointer;
}

.command--active {
  background: var(--color-surface-muted);
}

.command__icon {
  color: var(--color-text-subtle);
}

.command__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.command__hint {
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
}

.palette-enter-active,
.palette-leave-active {
  transition: opacity var(--duration-fast);
}

.palette-enter-active .palette,
.palette-leave-active .palette {
  transition: transform var(--duration-base) var(--ease-out);
}

.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}

.palette-enter-from .palette {
  transform: translateY(-8px) scale(0.98);
}
</style>
