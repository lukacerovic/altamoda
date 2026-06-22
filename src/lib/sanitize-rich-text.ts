// Server-side allowlist sanitizer for the rich-text product fields
// (description / benefits / ingredients / declaration / usageInstructions).
//
// Dependency-free on purpose: it runs in Node API routes and must NOT pull a
// DOM library (jsdom via isomorphic-dompurify crashed the Vercel runtime with
// ERR_REQUIRE_ESM). This is defense-in-depth — the storefront ALSO sanitizes
// with DOMPurify at render, which is the authoritative XSS guard. This pass
// keeps the database from ever storing dangerous markup, even if a write
// bypasses the admin UI.
//
// Tiptap emits a small, known tag set; everything else is stripped. All
// attributes are removed except a safe href on <a>.

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li',
  'a', 'h1', 'h2', 'h3', 'blockquote',
])

// Elements whose *content* must be dropped too, not just the tags.
const DANGEROUS_BLOCK = 'script|style|iframe|object|embed|noscript|template|svg|math|link|meta|base|title'

function safeHref(rawAttrs: string): string {
  const m = rawAttrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i)
  if (!m) return ''
  const url = (m[2] ?? m[3] ?? m[4] ?? '').trim()
  // Only allow http(s), mailto, and site-relative links. Blocks javascript:,
  // data:, vbscript:, and other script-bearing schemes.
  if (!/^(https?:\/\/|mailto:|\/)/i.test(url)) return ''
  return ` href="${url.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer"`
}

export function sanitizeRichText(input: string | null | undefined): string | null {
  if (input == null) return null
  let html = String(input)

  // 1. Strip comments and CDATA (can hide vectors / break the tag scanner).
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '')

  // 2. Remove dangerous elements WITH their content. Loop until stable so
  //    nested/spliced tricks (e.g. <scr<script>ipt>) can't survive a pass.
  const withContent = new RegExp(`<(${DANGEROUS_BLOCK})\\b[\\s\\S]*?<\\/\\1\\s*>`, 'gi')
  const bareDanger = new RegExp(`<\\/?(?:${DANGEROUS_BLOCK})\\b[^>]*>`, 'gi')
  let prev
  do { prev = html; html = html.replace(withContent, '').replace(bareDanger, '') } while (html !== prev)

  // 3. Walk every remaining tag. Keep allowlisted tags (stripping all attrs
  //    except a safe href on <a>); drop everything else but keep inner text.
  html = html.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g, (_m, close, tag, attrs) => {
    const t = tag.toLowerCase()
    if (!ALLOWED_TAGS.has(t)) return ''
    if (close) return `</${t}>`
    if (t === 'a') return `<a${safeHref(attrs)}>`
    return `<${t}>`
  })

  // 4. Drop any stray angle-bracket constructs the tag scanner didn't match.
  html = html.replace(/<(?![a-zA-Z/])/g, '&lt;')

  return html.trim()
}
