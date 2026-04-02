import { $fetch } from 'ofetch';

type Methods = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';

class HttpRequest {
  private getDefaultHeaders() {
    const { getItem } = useStorage();

    const token = getItem('accessToken');

    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private handleError(error: any) {
    const toast = useAppToast();
    const { clearAuth } = useAuth();

    const status = error?.response?.status;
    const message = error?.response?._data?.message || error.message;

    toast.error(`${status || ''} ${message || '未知錯誤'}`);

    if (status === 401) clearAuth();
  }

  public async request<T = any>(
    url: string,
    method: Methods,
    data?: any,
    options?: any,
  ): Promise<T> {
    const headers = this.getDefaultHeaders();
    const config = useRuntimeConfig();

    const requestOptions: any = {
      baseURL: config.public.API_URL || 'http://localhost:3000/api/v1/',
      method,
      headers,
      ...options,
    };

    if (method === 'GET') requestOptions.params = data;
    else requestOptions.body = data;

    try {
      return await $fetch<T>(url, requestOptions);
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  public get<T = any>(url: string, params?: any, options?: any) {
    return this.request<T>(url, 'GET', params, options);
  }

  public post<T = any>(url: string, data?: any, options?: any) {
    return this.request<T>(url, 'POST', data, options);
  }

  public put<T = any>(url: string, data?: any, options?: any) {
    return this.request<T>(url, 'PUT', data, options);
  }

  public patch<T = any>(url: string, data?: any, options?: any) {
    return this.request<T>(url, 'PATCH', data, options);
  }

  public delete<T = any>(url: string, data?: any, options?: any) {
    return this.request<T>(url, 'DELETE', data, options);
  }
}

const httpRequest = new HttpRequest();
export default httpRequest;
