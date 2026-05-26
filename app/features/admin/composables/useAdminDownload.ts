/**
 * app/features/admin/composables/useAdminDownload.ts
 *
 * Browser download helpers for admin CSV / file exports.
 */

export function useAdminDownload() {
  /** Build a filename with a timestamp suffix, e.g. "conversations-1716192000000.csv". */
  function buildTimestampedFilename(prefix: string, ext: string): string {
    return `${prefix}-${Date.now()}.${ext}`
  }

  /**
   * Trigger a browser file download from a URL.
   * A temporary `<a>` element is created, clicked, then removed.
   */
  function downloadUrl(url: string, filename?: string): void {
    const a = document.createElement('a')
    a.href = url
    a.download = filename ?? buildTimestampedFilename('download', 'csv')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return { downloadUrl, buildTimestampedFilename }
}
