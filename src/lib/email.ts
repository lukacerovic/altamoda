import { Resend } from 'resend'

const IS_PROD = process.env.NODE_ENV === 'production'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    if (IS_PROD) throw new Error(`Missing required env var: ${name}`)
    return ''
  }
  return value
}

function getResend() {
  const key = requireEnv('RESEND_API_KEY')
  return new Resend(key || 'dev-placeholder')
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || 'Altamoda <onboarding@resend.dev>'
}

function getNewsletterFrom() {
  return process.env.NEWSLETTER_FROM
    || process.env.EMAIL_FROM
    || 'Altamoda Newsletter <newsletter@altamoda.rs>'
}

function getSiteUrl() {
  const explicit = process.env.SITE_URL
  if (explicit) return explicit

  // Vercel auto-sets VERCEL_URL (no scheme) on every deployment. Use it as a safety
  // net so emails still render absolute links if SITE_URL was never configured.
  const vercelHost = process.env.VERCEL_URL
  if (vercelHost) return `https://${vercelHost}`

  if (IS_PROD) throw new Error('SITE_URL is required in production')
  return 'http://localhost:3000'
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

// ──────────────────────────────────────────────────────────
// Transactional (Resend) — critical low-volume mail
// ──────────────────────────────────────────────────────────

export async function sendTransactional({ to, subject, html, from }: SendEmailOptions) {
  const result = await getResend().emails.send({
    from: from || getEmailFrom(),
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  })

  if (result.error) {
    console.error('[email] Resend send failed:', result.error)
    throw new Error(result.error.message)
  }

  return result.data
}

// Back-compat alias for any callers still importing sendEmail.
export const sendEmail = sendTransactional

// ──────────────────────────────────────────────────────────
// Bulk (Resend batch API) — newsletter campaigns
// ──────────────────────────────────────────────────────────
// Uses Resend instead of cPanel SMTP so newsletter sending works on Vercel
// serverless. Resend's batch endpoint accepts up to 100 emails per call;
// we throttle batches to stay under the 2 req/s default rate limit.

const RESEND_BATCH_SIZE = 100
const RESEND_BATCH_DELAY_MS = 600

export interface BulkEmail {
  to: string
  subject: string
  html: string
  from?: string
}

export interface BulkSendResult {
  sent: number
  failed: number
  failures: { to: string; error: string }[]
}

export async function sendBulk(
  emails: Iterable<BulkEmail> | AsyncIterable<BulkEmail> | BulkEmail[],
  // `meta.total` was used by the SMTP path to skip a trailing delay;
  // unused with Resend batch but kept for backwards-compat with callers.
  _meta: { total?: number } = {}
): Promise<BulkSendResult> {
  const resend = getResend()
  const result: BulkSendResult = { sent: 0, failed: 0, failures: [] }
  let chunk: BulkEmail[] = []
  let firstBatch = true

  const flush = async () => {
    if (chunk.length === 0) return

    if (!firstBatch) {
      await new Promise((r) => setTimeout(r, RESEND_BATCH_DELAY_MS))
    }
    firstBatch = false

    const payload = chunk.map((e) => ({
      from: e.from || getEmailFrom(),
      to: [e.to],
      subject: e.subject,
      html: e.html,
    }))

    try {
      const { error } = await resend.batch.send(payload)
      if (error) {
        for (const e of chunk) {
          result.failed++
          result.failures.push({ to: e.to, error: error.message })
        }
        console.error('[email] Resend batch failed:', error)
      } else {
        result.sent += chunk.length
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const safe = message.split('\n')[0].slice(0, 200)
      for (const e of chunk) {
        result.failed++
        result.failures.push({ to: e.to, error: safe })
      }
      console.error(`[email] Resend batch crashed: ${safe}`)
    }
    chunk = []
  }

  for await (const email of emails as AsyncIterable<BulkEmail>) {
    chunk.push(email)
    if (chunk.length >= RESEND_BATCH_SIZE) {
      await flush()
    }
  }
  await flush()

  return result
}

// Rewrite relative + localhost image URLs to absolute public URLs.
// Email clients can't fetch from `localhost` or relative paths — they open
// the message on their own servers. All `<img src>`, CSS `url(...)` (header
// background images), and `href` attributes are rewritten to use SITE_URL.
export function rewriteAssetUrls(html: string): string {
  const base = getSiteUrl().replace(/\/$/, '')
  const isAbsolute = (url: string) =>
    /^(https?:|data:|cid:|mailto:|tel:)/i.test(url)
  const toAbsolute = (url: string) => {
    if (!url) return url
    // Skip in-page anchors — `#unsubscribe` should not become `${SITE_URL}/#unsubscribe`.
    if (url.startsWith('#')) return url
    if (isAbsolute(url)) {
      const localhostMatch = url.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i)
      if (localhostMatch) return `${base}${localhostMatch[3] || ''}`
      return url
    }
    if (url.startsWith('//')) return `https:${url}`
    if (url.startsWith('/')) return `${base}${url}`
    return `${base}/${url}`
  }

  return html
    .replace(/(<img[^>]*\bsrc=)("|')([^"']+)\2/gi, (_m, prefix, q, url) => `${prefix}${q}${toAbsolute(url)}${q}`)
    .replace(/url\((['"]?)([^)'"]+)\1\)/gi, (_m, q, url) => `url(${q}${toAbsolute(url)}${q})`)
    .replace(/(<a[^>]*\bhref=)("|')([^"']+)\2/gi, (_m, prefix, q, url) => `${prefix}${q}${toAbsolute(url)}${q}`)
}

export function getUnsubscribeUrl(email: string) {
  const token = Buffer.from(email).toString('base64url')
  return `${getSiteUrl()}/newsletter/unsubscribe?token=${token}`
}

export { getSiteUrl, getEmailFrom, getNewsletterFrom }
