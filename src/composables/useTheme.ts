import { computed, ref } from 'vue';

export type Theme = 'light-theme' | 'dark-theme';

const STORAGE_KEY = 'theme';

function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light-theme' || value === 'dark-theme' ? value : null;
  } catch {
    return null;
  }
}

function storeTheme(value: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage may be unavailable (private mode, blocked site data). The theme still applies for this visit.
  }
}

function preferredTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark-theme' : 'light-theme';
}

// Module-level state so every component shares the same theme.
const theme = ref<Theme>(readStoredTheme() ?? preferredTheme());

export function useTheme() {
  const isDarkTheme = computed(() => theme.value === 'dark-theme');

  function setTheme(value: Theme) {
    theme.value = value;
    storeTheme(value);
  }

  function toggleTheme() {
    setTheme(isDarkTheme.value ? 'light-theme' : 'dark-theme');
  }

  return { theme, isDarkTheme, setTheme, toggleTheme };
}
