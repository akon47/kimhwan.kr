import { computed, ref, watch } from 'vue';
import en from './en';
import ko, { type Messages } from './ko';

export type { Messages };
export type Locale = 'ko' | 'en';

/** A text that exists in every language, for content kept next to its data (projects, homelab features). */
export type Localized = Readonly<Record<Locale, string>>;

const STORAGE_KEY = 'locale';
const CATALOGS: Record<Locale, Messages> = { ko, en };

function isLocale(value: unknown): value is Locale {
  return value === 'ko' || value === 'en';
}

/** The language the visitor picked on an earlier visit, if any. */
function readStoredLocale(): Locale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

function storeLocale(value: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage may be unavailable (private mode, blocked site data). The language still applies for this visit.
  }
}

/**
 * First visit: Korean for visitors from Korea, English for everyone else. "From Korea" is a browser set to
 * Korean or a clock on Korean time, both known without asking a server, so the right language is there on
 * the first paint. Keep in sync with the inline script in index.html.
 */
export function detectLocale(
  languages: readonly string[] = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]),
  timeZone: string | undefined = Intl.DateTimeFormat().resolvedOptions().timeZone,
): Locale {
  const korean = languages.some((language) => /^ko\b/i.test(language ?? ''));
  return korean || timeZone === 'Asia/Seoul' ? 'ko' : 'en';
}

// Module-level state so every component shares the same language.
export const locale = ref<Locale>(readStoredLocale() ?? detectLocale());

/** The texts of the current language. Reading it inside a computed or a template keeps that reactive. */
export const messages = computed<Messages>(() => CATALOGS[locale.value]);

// index.html sets the same attribute before first paint; this keeps it in sync afterwards.
if (typeof document !== 'undefined') {
  watch(
    locale,
    (value) => {
      document.documentElement.lang = value;
      document.querySelector('meta[name="description"]')?.setAttribute('content', CATALOGS[value].meta.description);
    },
    { immediate: true },
  );
}

/** Switches the language and remembers the choice for later visits. */
export function setLocale(value: Locale) {
  locale.value = value;
  storeLocale(value);
}

export function useI18n() {
  function toggleLocale() {
    setLocale(locale.value === 'ko' ? 'en' : 'ko');
  }

  return { locale, t: messages, setLocale, toggleLocale };
}
