/**
 * useWidgetConfigStore (T-006)
 *
 * Holds the widget configuration fetched from GET /api/widget/config,
 * plus derived online status and load state.
 */

import type { WidgetConfigVM } from '~/types/chat';

export const useWidgetConfigStore = defineStore('widgetConfig', () => {
  const config = ref<WidgetConfigVM | null>(null);
  const isLoaded = ref(false);
  const isOnline = ref(false);

  function setConfig(payload: WidgetConfigVM) {
    config.value = payload;
    isLoaded.value = true;
    isOnline.value = payload.status !== 'offline';
  }

  function setOffline() {
    isOnline.value = false;
  }

  function reset() {
    config.value = null;
    isLoaded.value = false;
    isOnline.value = false;
  }

  return {
    config,
    isLoaded,
    isOnline,

    setConfig,
    setOffline,
    reset,
  };
});
