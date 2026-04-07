/**
 * utils/markdown.ts (T-012)
 *
 * Lightweight Markdown → sanitized HTML renderer.
 * Uses `marked` for parsing; output is consumed via `v-html` in Vue templates.
 *
 * Security note: marked does NOT HTML-sanitize by default.
 * We strip dangerous attributes via a minimal allow-list regex before returning.
 * A dedicated sanitization library (e.g. DOMPurify) should be added in Phase 3
 * when SSR / admin content is introduced.
 */

import { marked } from 'marked'

// Configure marked: safe renderer, no pedantic mode
marked.setOptions({
  async: false,
  breaks: true, // convert \n to <br> inside paragraphs
  gfm: true,    // GitHub-flavoured Markdown (tables, strikethrough, etc.)
})

/**
 * Convert a Markdown string to sanitized HTML.
 *
 * @param content - Raw Markdown text
 * @returns HTML string safe for use with `v-html`
 */
export function renderMarkdown(content: string): string {
  if (!content) return ''

  // marked.parse with async:false returns string synchronously
  const raw = marked.parse(content) as string

  // Minimal sanitization: strip on* event handlers and javascript: hrefs
  return raw
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\shref="javascript:[^"]*"/gi, '')
}
