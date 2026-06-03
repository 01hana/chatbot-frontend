/**
 * Admin Widget Settings API Service (T-058)
 */

import httpRequest from '@/services/index';
import type { WidgetSettingsUpdatePayload, WidgetSettingsVM } from '~/types/admin';
import type { ApiResponse } from '~/types/api';

class WidgetSettingsService {
  public async getWidgetSettings(): Promise<WidgetSettingsVM> {
    const res = await httpRequest.get<ApiResponse<WidgetSettingsVM>>('admin/widget-settings');

    return res.data;
  }

  public async updateWidgetSettings(
    data: WidgetSettingsUpdatePayload,
  ): Promise<WidgetSettingsVM> {
    const res = await httpRequest.patch<ApiResponse<WidgetSettingsVM>>(
      'admin/widget-settings',
      data,
    );

    return res.data;
  }
}

export default new WidgetSettingsService();
