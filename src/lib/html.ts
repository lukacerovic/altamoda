import DOMPurify from 'isomorphic-dompurify'

/**
 * Strip all HTML tags from a rich-text value and collapse whitespace, for use
 * in plain-text contexts (meta descriptions, OpenGraph, previews) where the
 * product long-text fields are now stored as HTML.
 */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return ''
  const text = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
  return text.replace(/\s+/g, ' ').trim()
}
