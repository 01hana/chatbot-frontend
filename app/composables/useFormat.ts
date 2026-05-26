import { format } from 'date-fns';

export function useFormat() {
  function formatDate(dateValue: string, type?: string) {
    if (type === 'date') return format(new Date(dateValue), 'yyyy-MM-dd');

    return format(new Date(dateValue), 'yyyy-MM-dd HH:mm:ss');
  }

  /** yyyy/MM/dd HH:mm — suitable for admin tables and detail pages. */
  function formatDateTime(dateValue: string | Date): string {
    return format(new Date(dateValue), 'yyyy/MM/dd HH:mm');
  }

  /** yyyy-MM-dd — date only. */
  function formatDateOnly(dateValue: string | Date): string {
    return format(new Date(dateValue), 'yyyy-MM-dd');
  }

  /** HH:mm — time only, for chat bubbles and compact displays. */
  function formatTimeShort(dateValue: string | Date): string {
    return format(new Date(dateValue), 'HH:mm');
  }

  async function formatUrlToFile(url: string) {
    const res = await fetch(url);
    const blob = await res.blob();

    return new File([blob], url.split('/').pop()!, {
      type: blob.type,
    });
  }

  function toFormData(data: Record<string, unknown>) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value == null) return;

      if (value instanceof File) {
        formData.append(key, value);
        return;
      }

      if (Array.isArray(value) && value.every(v => v instanceof File)) {
        (value as File[]).forEach(file => formData.append(`${key}[]`, file));
        return;
      }

      formData.append(key, String(value));
    });

    return formData;
  }

  return {
    formatDate,
    formatDateTime,
    formatDateOnly,
    formatTimeShort,
    formatUrlToFile,
    toFormData,
  };
}
