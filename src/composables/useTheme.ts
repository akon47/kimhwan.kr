import { computed, ref, watch } from 'vue';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const THEME_COLORS: Record<Theme, string> = { light: '#fafafa', dark: '#09090b' };

/** Reads the saved choice. Also accepts the values written by the previous site version. */
function readStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'light' || value === 'light-theme') {
      return 'light';
    }
    return value === 'dark' || value === 'dark-theme' ? 'dark' : null;
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

const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)');

function systemTheme(): Theme {
  return systemDark?.matches ? 'dark' : 'light';
}

// Module-level state so every component shares the same theme.
const storedTheme = readStoredTheme();
const theme = ref<Theme>(storedTheme ?? systemTheme());
let followsSystem = storedTheme === null;

// Until the visitor picks a theme, follow the OS setting live.
systemDark?.addEventListener('change', () => {
  if (followsSystem) {
    theme.value = systemTheme();
  }
});

// index.html sets the same attribute before first paint; this keeps it in sync afterwards.
watch(
  theme,
  (value) => {
    document.documentElement.dataset.theme = value;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[value]);
  },
  { immediate: true },
);

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark');

  function setTheme(value: Theme) {
    followsSystem = false;
    theme.value = value;
    storeTheme(value);
  }

  function toggleTheme() {
    setTheme(isDark.value ? 'light' : 'dark');
  }

  return { theme, isDark, setTheme, toggleTheme };
}
