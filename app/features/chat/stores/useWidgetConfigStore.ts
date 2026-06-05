/**
 * useWidgetConfigStore (T-006)
 *
 * Holds the widget configuration fetched from GET /api/widget/config,
 * plus derived online status and load state.
 */

import type { WidgetConfigVM } from '~/types/chat';

export const useWidgetConfigStore = defineStore('widgetConfig', () => {
  const config = ref<WidgetConfigVM | null>(null);
  const [isLoaded, setLoaded] = useAppState(false);
  const [isOnline, setOnline] = useAppState(false);

  function setConfig(payload: WidgetConfigVM) {
    config.value = payload;
    setLoaded(true);
    setOnline(payload.status !== 'offline');
  }

  function setOffline() {
    setOnline(false);
  }

  function reset() {
    config.value = null;
    setLoaded(false);
    setOnline(false);
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
