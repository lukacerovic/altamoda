/**
 * Client-side email preview generator.
 * Wraps TipTap body content into a responsive Altamoda email template
 * for live preview in the admin editor.
 *
 * Aesthetic: clean, minimal, unisex beauty — inspired by Aesop / Le Labo / Byredo.
 * Warm neutrals, generous whitespace, refined typography.
 */

// ── Palette: warm neutral, unisex ──
const PAGE_BG = '#f7f5f2'
const HEADER_BG = '#11120D'
const CONTENT_BG = '#ffffff'
const FOOTER_BG = '#f0ece7'

const TEXT_PRIMARY = '#11120D'
const TEXT_BODY = '#3d3833'
const TEXT_MUTED = '#9e9389'
const ACCENT = '#7c6f64'
const DIVIDER = '#D8CFBC'

const FONT = "font-family:'Georgia','Times New Roman',serif;"

/** Detect whether html is already a full email document */
export function isFullEmailHtml(html: string): boolean {
  const trimmed = html.trimStart()
  return trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')
}

/**
 * Convert TipTap HTML into email-safe inline-styled HTML.
 * Email clients strip <style> blocks, so every element needs inline styles.
 *
 * IMPORTANT: only elements that do NOT already have a `style` attribute are
 * styled. Pre-styled templates (e.g. Info, with hardcoded white-text colors
 * over a background image) pass through untouched. Plain TipTap output (no
 * inline styles) gets the default email-safe styling.
 */
export function convertToEmailHtml(body: string): string {
  // Match a tag's open form: <h1>, <h1 class="x">, <h1 data-foo="y">, but
  // NOT <h1 style="...">. The negative-lookahead `(?![^>]*\bstyle=)` ensures
  // we only touch elements that don't already have an inline style.
  const noStyleTag = (tag: string) =>
    new RegExp(`<${tag}((?![^>]*\\bstyle=)[^>]*)>`, 'g')

  return body
    // Headings — only when no inline style is present
    .replace(noStyleTag('h1'),
      `<h1$1 style="margin:0 0 20px;font-size:30px;font-weight:400;color:${TEXT_PRIMARY};letter-spacing:2px;text-transform:uppercase;${FONT}">`)
    .replace(noStyleTag('h2'),
      `<h2$1 style="margin:0 0 16px;font-size:24px;font-weight:400;color:${TEXT_PRIMARY};letter-spacing:1px;${FONT}">`)
    .replace(noStyleTag('h3'),
      `<h3$1 style="margin:0 0 12px;font-size:18px;font-weight:600;color:${TEXT_PRIMARY};${FONT}">`)
    // Paragraphs — preserve text-align (TipTap-only attribute)
    .replace(/<p style="text-align:\s*(center|right|left)">/g,
      `<p style="margin:0 0 18px;font-size:16px;line-height:1.8;color:${TEXT_BODY};${FONT}text-align:$1;">`)
    .replace(noStyleTag('p'),
      `<p$1 style="margin:0 0 18px;font-size:16px;line-height:1.8;color:${TEXT_BODY};${FONT}">`)
    // Images — handle width and alignment from data attributes
    .replace(/<img ([^>]*?)>/g, (_match, attrs: string) => {
      let margin = '20px auto'
      if (attrs.includes('data-align="left"')) margin = '20px 20px 20px 0'
      else if (attrs.includes('data-align="right"')) margin = '20px 0 20px auto'
      // Extract width if set
      const widthMatch = attrs.match(/style="width:\s*([^"]+)"/)
      const widthStyle = widthMatch ? `width:${widthMatch[1]};` : ''
      // Clean attrs of style and data-align
      const cleanAttrs = attrs
        .replace(/style="[^"]*"/g, '')
        .replace(/data-align="[^"]*"/g, '')
        .trim()
      return `<img ${cleanAttrs} style="${widthStyle}max-width:100%;height:auto;display:block;margin:${margin};border-radius:4px;" />`
    })
    // CTA links (bold + link → renders as button)
    .replace(/<strong><a ([^>]*?)>([^<]*)<\/a><\/strong>/g,
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 8px;"><tr><td style="background-color:${HEADER_BG};border-radius:6px;"><a $1 style="display:inline-block;padding:14px 36px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:2px;text-transform:uppercase;${FONT}">$2</a></td></tr></table>`)
    // Regular links — only style links without inline styles
    .replace(/<a((?![^>]*\bstyle=)[^>]*)>/g,
      `<a$1 style="color:${ACCENT};text-decoration:underline;">`)
    // Lists — only style elements without inline styles
    .replace(noStyleTag('ul'), '<ul$1 style="margin:0 0 18px;padding-left:24px;">')
    .replace(noStyleTag('ol'), '<ol$1 style="margin:0 0 18px;padding-left:24px;">')
    .replace(noStyleTag('li'),
      `<li$1 style="margin:0 0 6px;font-size:16px;line-height:1.8;color:${TEXT_BODY};${FONT}">`)
    // Horizontal rule
    .replace(/<hr>/g, `<hr style="border:none;border-top:1px solid ${DIVIDER};margin:32px 0;" />`)
    // Blockquote
    .replace(/<blockquote>/g, `<blockquote style="margin:24px 0;padding:16px 28px;border-left:3px solid ${ACCENT};background:${PAGE_BG};font-style:italic;color:${TEXT_BODY};">`)
    // Strong / Em — only when not already styled
    .replace(/<strong((?![^>]*\bstyle=)[^>]*)>/g,
      `<strong$1 style="font-weight:700;color:${TEXT_PRIMARY};">`)
}

// ── Customisation options for header / footer ──

export interface EmailTemplateOptions {
  headerTitle?: string
  headerSubtitle?: string
  headerBg?: string
  headerImage?: string
  headerBgImage?: string
  /**
   * Background image used by templates that have an inline body section
   * with `background-image: url(...)` (currently the Info template).
   * Editing this rewrites the URL in the body content via regex on save/preview.
   */
  bodyBgImage?: string
  footerText?: string
  footerCopyright?: string
}

export const defaultEmailOptions: EmailTemplateOptions = {
  headerTitle: 'ALTAMODA',
  headerSubtitle: 'Heritage',
  headerBg: HEADER_BG,
  headerImage: '',
  footerText: 'Altamoda Heritage',
  footerCopyright: `© ${new Date().getFullYear()} · Sva prava zadrzana`,
}

/**
 * Wrap styled body content in the full Altamoda email layout.
 * `unsubscribeUrl` should be passed for real sends so the footer link works
 * (CAN-SPAM/GDPR requirement). The preview iframe passes undefined → renders
 * a non-functional placeholder that's marked as such.
 */
export function wrapInEmailTemplate(
  styledBody: string,
  opts: EmailTemplateOptions = {},
  unsubscribeUrl?: string
): string {
  const o = { ...defaultEmailOptions, ...opts }
  const hBg = o.headerBg || HEADER_BG
  const unsubHref = unsubscribeUrl || '#preview-unsubscribe'

  // Header content — either an image or text
  const headerContent = o.headerImage
    ? `<img src="${o.headerImage}" alt="${o.headerTitle}" style="max-width:260px;max-height:80px;height:auto;display:block;margin:0 auto;" />`
    : [
        `<p style="margin:0;font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:4px;text-transform:uppercase;${FONT}">· · ·</p>`,
        `<h1 style="margin:8px 0 0;font-size:32px;font-weight:400;color:#ffffff;letter-spacing:6px;text-transform:uppercase;${FONT}">${o.headerTitle}</h1>`,
        o.headerSubtitle
          ? `<p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:3px;text-transform:uppercase;${FONT}">${o.headerSubtitle}</p>`
          : '',
      ].join('\n')

  return `<!DOCTYPE html>
<html lang="sr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${o.headerTitle}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
@media only screen and (max-width:620px){
.ew{padding:20px 12px!important}
.ec{width:100%!important;border-radius:0!important}
.eh{padding:28px 24px 20px!important}
.eb{padding:32px 24px!important}
.ef{padding:24px!important}
img{max-width:100%!important;height:auto!important}
h1{font-size:24px!important;letter-spacing:1px!important}
h2{font-size:20px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};${FONT}color:${TEXT_BODY};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${PAGE_BG};">
<tr>
<td class="ew" align="center" style="padding:48px 20px;">
<table class="ec" role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${CONTENT_BG};border-radius:2px;overflow:hidden;">

<!-- Header -->
<tr>
<td class="eh" align="center" style="padding:${o.headerBgImage ? '60px 40px 52px' : '36px 40px 28px'};background-color:${hBg};${o.headerBgImage ? `background-image:url('${o.headerBgImage}');background-size:cover;background-position:center;` : ''}">
${headerContent}
</td>
</tr>

<!-- Accent line -->
<tr>
<td align="center" style="background-color:${CONTENT_BG};">
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
<tr><td style="width:48px;height:1px;background-color:${ACCENT};font-size:0;line-height:0;">&nbsp;</td></tr>
</table>
</td>
</tr>

<!-- Content -->
<tr>
<td class="eb" style="padding:40px 48px 32px;${o.bodyBgImage ? `background-image:url('${o.bodyBgImage}');background-size:cover;background-position:center;background-repeat:no-repeat;` : ''}">
<!-- EMAIL_BODY_START -->
${styledBody}
<!-- EMAIL_BODY_END -->
</td>
</tr>

<!-- Footer -->
<tr>
<td class="ef" style="padding:28px 48px;background-color:${FOOTER_BG};border-top:1px solid ${DIVIDER};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">
<p style="margin:0 0 6px;font-size:11px;color:${TEXT_MUTED};letter-spacing:1px;text-transform:uppercase;${FONT}">${o.footerText}</p>
<p style="margin:0 0 12px;font-size:11px;color:${TEXT_MUTED};${FONT}">${o.footerCopyright}</p>
<p style="margin:0;font-size:11px;${FONT}"><a href="${unsubHref}" style="color:${ACCENT};text-decoration:none;border-bottom:1px solid ${DIVIDER};">Odjavi se</a></p>
</td>
</tr>
</table>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`
}

/**
 * Replace any inline `background-image: url('...')` in the body with the
 * supplied URL. Used by templates whose body contains a hardcoded background
 * image (e.g. Info) so the editor settings field can swap it dynamically.
 */
export function applyBodyBgImage(body: string, bgImageUrl?: string): string {
  if (!bgImageUrl) return body
  // Escape characters that would break out of the CSS url('...') context.
  const safe = bgImageUrl.replace(/['"\\()]/g, (c) => `\\${c}`)
  return body.replace(
    /background-image:\s*url\((['"]?)[^)'"]*\1\)/gi,
    `background-image: url('${safe}')`
  )
}

/**
 * Extract the first `background-image: url('...')` value from a body, or
 * return undefined if there is none. Used to seed the editor settings field.
 */
export function extractBodyBgImage(body: string): string | undefined {
  const match = body.match(/background-image:\s*url\((['"]?)([^)'"]+)\1\)/i)
  return match?.[2]
}

/**
 * Full pipeline: body HTML → email-safe styles → responsive wrapper.
 * If already a full email doc, returns as-is.
 *
 * `unsubscribeUrl` should be supplied for real recipient sends so the footer
 * link is functional. Editor/preview callers can omit it.
 */
export function generateEmailPreview(
  bodyContent: string,
  opts?: EmailTemplateOptions,
  unsubscribeUrl?: string
): string {
  if (isFullEmailHtml(bodyContent)) return bodyContent
  const body = applyBodyBgImage(bodyContent, opts?.bodyBgImage)
  return wrapInEmailTemplate(convertToEmailHtml(body), opts, unsubscribeUrl)
}

/**
 * Extract editable body content from a full email HTML.
 * Looks for EMAIL_BODY markers first (new format), then
 * falls back to heuristic extraction (legacy templates).
 */
export function extractBodyContent(fullHtml: string): string {
  if (!isFullEmailHtml(fullHtml)) return fullHtml

  // New format — marked body section
  const markerMatch = fullHtml.match(
    /<!-- EMAIL_BODY_START -->([\s\S]*?)<!-- EMAIL_BODY_END -->/
  )
  if (markerMatch) {
    return stripInlineStyles(markerMatch[1].trim())
  }

  // Legacy format — heuristic extraction
  return extractLegacyBody(fullHtml)
}

function extractLegacyBody(html: string): string {
  let body = html

  // Cut after the header (ends after "Heritage" text)
  const headerEnd = body.match(/Heritage[\s\S]*?<\/td>\s*<\/tr>/i)
  if (headerEnd && headerEnd.index !== undefined) {
    body = body.slice(headerEnd.index + headerEnd[0].length)
  }

  // Cut before the footer (beige/light background)
  const footerPatterns = ['#FFFBF4', '#f0ece7']
  for (const pattern of footerPatterns) {
    const idx = body.indexOf(pattern)
    if (idx > -1) {
      const trBefore = body.lastIndexOf('<tr', idx)
      if (trBefore > -1) { body = body.slice(0, trBefore); break }
    }
  }

  // Strip table wrapper markup
  body = body
    .replace(/<\/?table[^>]*>/gi, '')
    .replace(/<\/?tbody[^>]*>/gi, '')
    .replace(/<\/?tr[^>]*>/gi, '')
    .replace(/<\/?td[^>]*>/gi, '')

  // Strip email-specific attributes
  body = body
    .replace(/ style="[^"]*"/gi, '')
    .replace(/ width="[^"]*"/gi, '')
    .replace(/ role="[^"]*"/gi, '')
    .replace(/ cellpadding="[^"]*"/gi, '')
    .replace(/ cellspacing="[^"]*"/gi, '')
    .replace(/ align="[^"]*"/gi, '')
    .replace(/ class="[^"]*"/gi, '')

  body = body.replace(/\n\s*\n\s*\n/g, '\n').trim()
  return body
}

function stripInlineStyles(html: string): string {
  return html
    // Preserve text-align (TipTap uses it), strip everything else
    .replace(/ style="([^"]*)"/gi, (_match, styles: string) => {
      const alignMatch = styles.match(/text-align:\s*(center|right|left)/)
      return alignMatch ? ` style="text-align: ${alignMatch[1]}"` : ''
    })
    .replace(/ class="[^"]*"/gi, '')
    .trim()
}
