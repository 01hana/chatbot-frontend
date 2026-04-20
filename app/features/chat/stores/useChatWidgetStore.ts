/**
 * useChatWidgetStore (T-006)
 *
 * Controls the top-level widget open/close state and display mode.
 *
 * Locale is no longer stored here. The single source of truth for locale
 * is useI18n().locale. Persistence to localStorage is handled in ChatWidget.vue.
 */

export const useChatWidgetStore = defineStore('chatWidget', () => {
  const isOpen = ref(false);
  const mode = ref<'normal' | 'fallback'>('normal');

  function setOpen(value: boolean) {
    isOpen.value = value;
  }

  function toggle() {
    isOpen.value = !isOpen.value;
  }

  function setMode(m: 'normal' | 'fallback') {
    mode.value = m;
  }

  function reset() {
    isOpen.value = false;
    mode.value = 'normal';
  }

  return {
    isOpen,
    mode,

    setOpen,
    toggle,
    setMode,
    reset,
  };
});
