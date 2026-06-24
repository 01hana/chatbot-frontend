import WidgetSettingsService from '~/services/api/admin/widgetSettings';
import type { WidgetSettingsUpdatePayload, WidgetSettingsVM } from '~/types/admin';

export const useAdminWidgetSettings = defineStore('admin-widget-settings', () => {
  const settings = ref<WidgetSettingsVM | null>(null);
  const [loading, setLoading] = useAppState(true);
  const [saving, setSaving] = useAppState(false);
  const error = ref('');

  async function get() {
    setLoading(true);
    error.value = '';

    try {
      settings.value = await WidgetSettingsService.getWidgetSettings();
    } catch (e) {
      settings.value = null;
      error.value = e instanceof Error ? e.message : '載入 Widget 設定失敗，請稍後再試';
    } finally {
      setLoading(false);
    }

    return settings.value;
  }

  async function update(data: WidgetSettingsUpdatePayload) {
    setSaving(true);

    try {
      settings.value = await WidgetSettingsService.updateWidgetSettings(data);

      return settings.value;
    } finally {
      setSaving(false);
    }
  }

  return {
    settings,
    loading,
    saving,
    error,
    get,
    update,
  };
});
