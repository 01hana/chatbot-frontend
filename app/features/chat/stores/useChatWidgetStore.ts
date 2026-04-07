/**
 * useChatWidgetStore (T-006)
 *
 * Controls the top-level widget open/close state, display mode,
 * and the active locale preference.
 */

export const useChatWidgetStore = defineStore('chatWidget', () => {
  const isOpen = ref(false);
  const mode = ref<'normal' | 'fallback'>('normal');
  const locale = ref<string>('zh-TW');

  function setOpen(value: boolean) {
    isOpen.value = value;
  }

  function toggle() {
    isOpen.value = !isOpen.value;
  }

  function setMode(m: 'normal' | 'fallback') {
    mode.value = m;
  }

  function setLocale(l: string) {
    locale.value = l;
  }

  function reset() {
    isOpen.value = false;
    mode.value = 'normal';
    locale.value = 'zh-TW';
  }

  return {
    // state
    isOpen,
    mode,
    locale,

    // actions
    setOpen,
    toggle,
    setMode,
    setLocale,
    reset,
  };
});
