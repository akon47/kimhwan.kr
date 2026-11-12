import { ref } from 'vue';

// Module-level so the header button and the palette itself share one flag.
const isOpen = ref(false);

/** Open/close state of the command palette (Ctrl+K). */
export function useCommandPalette() {
  return {
    isOpen,
    open: () => (isOpen.value = true),
    close: () => (isOpen.value = false),
    toggle: () => (isOpen.value = !isOpen.value),
  };
}
