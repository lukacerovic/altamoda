/**
 * Strip all HTML tags from a rich-text value and collapse whitespace, for use
 * in plain-text contexts (meta descriptions, OpenGraph, previews) where the
 * product long-text fields are stored as HTML.
 *
 * Implemented with a plain regex (no isomorphic-dompurify) on purpose: this runs
 * in server components (generateMetadata), and pulling DOMPurify in server-side
 * loads jsdom, whose transitive deps crash the Vercel runtime (ERR_REQUIRE_ESM).
 * The output is a plain-text meta value, so tag-stripping is all that's needed.
 */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, ' ') // strip tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&#x0*27;|&apos;/gi, "'")
    .replace(/&#x0*([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#0*(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/\s+/g, ' ')
    .trim()
}
