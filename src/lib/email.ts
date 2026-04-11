import { Resend } from 'resend'
import nodemailer, { type Transporter } from 'nodemailer'

const IS_PROD = process.env.NODE_ENV === 'production'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    if (IS_PROD) throw new Error(`Missing required env var: ${name}`)
    return ''
  }
  return value
}

const RESEND_KEY = requireEnv('RESEND_API_KEY')
const resend = new Resend(RESEND_KEY || 'dev-placeholder')

const EMAIL_FROM = process.env.EMAIL_FROM || 'Altamoda <onboarding@resend.dev>'
const SITE_URL = (() => {
  const value = process.env.SITE_URL
  if (!value) {
    if (IS_PROD) throw new Error('SITE_URL is required in production')
    return 'http://localhost:3000'
  }
  return value
})()

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}

// ──────────────────────────────────────────────────────────
// Transactional (Resend) — critical low-volume mail
// ──────────────────────────────────────────────────────────

export async function sendTransactional({ to, subject, html }: SendEmailOptions) {
  const result = await resend.emails.send({
    from: EMAIL_FROM,
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
// Bulk (cPanel SMTP via nodemailer) — newsletter campaigns
// ──────────────────────────────────────────────────────────

// Hard ceiling on outgoing rate to stay under Adriahost shared-host caps.
const BULK_HOURLY_CAP = 200
const BULK_DELAY_MS = Math.ceil((60 * 60 * 1000) / BULK_HOURLY_CAP)

// Singleton across HMR reloads in dev so we don't accumulate transporters and
// leak SMTP sockets on every save.
const globalForBulk = globalThis as unknown as { bulkTransporter?: Transporter }

function getBulkTransporter(): Transporter {
  if (globalForBulk.bulkTransporter) return globalForBulk.bulkTransporter

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const secure = process.env.SMTP_SECURE !== 'false'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP not configured: SMTP_HOST, SMTP_USER, SMTP_PASS required')
  }

  // Pool is rate-limited via the manual delay in sendBulk, not via nodemailer's
  // rateDelta/rateLimit options — keeping a single source of truth makes the
  // throttle ceiling easy to reason about (BULK_HOURLY_CAP).
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
  })

  globalForBulk.bulkTransporter = transporter
  return transporter
}

// Release SMTP sockets on graceful shutdown so the OS doesn't hold them in
// TIME_WAIT for minutes after the process exits.
if (typeof process !== 'undefined' && !globalForBulk.bulkTransporter) {
  const shutdown = () => {
    globalForBulk.bulkTransporter?.close()
    globalForBulk.bulkTransporter = undefined
  }
  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
}

export interface BulkEmail {
  to: string
  subject: string
  html: string
}

export interface BulkSendResult {
  sent: number
  failed: number
  failures: { to: string; error: string }[]
}

// Non-recoverable SMTP error codes — auth failure, host unreachable, etc.
// On these we abort the rest of the loop instead of failing N times in a row.
const FATAL_SMTP_CODES = new Set(['EAUTH', 'ECONNECTION', 'ECONNREFUSED', 'EDNS'])

function isFatalSmtpError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const code = (err as { code?: string }).code
  return code !== undefined && FATAL_SMTP_CODES.has(code)
}

export async function sendBulk(
  emails: Iterable<BulkEmail> | AsyncIterable<BulkEmail> | BulkEmail[],
  meta: { total?: number } = {}
): Promise<BulkSendResult> {
  const transporter = getBulkTransporter()
  const result: BulkSendResult = { sent: 0, failed: 0, failures: [] }
  const total = meta.total ?? (Array.isArray(emails) ? emails.length : undefined)
  let index = 0

  // Iterate without materializing the full list — supports lazy generators so
  // a 1000-recipient campaign doesn't hold N × templateSize HTML in RAM.
  for await (const email of emails as AsyncIterable<BulkEmail>) {
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: email.to,
        subject: email.subject,
        html: email.html,
      })
      result.sent++
    } catch (err) {
      result.failed++
      const message = err instanceof Error ? err.message : String(err)
      // Don't log full SMTP error bodies — they can include credentials/PII.
      const safe = message.split('\n')[0].slice(0, 200)
      result.failures.push({ to: email.to, error: safe })
      console.error(`[email] Bulk send failed for ${email.to}: ${safe}`)
      if (isFatalSmtpError(err)) {
        console.error('[email] Aborting bulk send — fatal SMTP error')
        break
      }
    }

    index++
    if (total === undefined || index < total) {
      await new Promise((resolve) => setTimeout(resolve, BULK_DELAY_MS))
    }
  }

  return result
}

// Rewrite relative + localhost image URLs to absolute public URLs.
// Email clients can't fetch from `localhost` or relative paths — they open
// the message on their own servers. All `<img src>`, CSS `url(...)` (header
// background images), and `href` attributes are rewritten to use SITE_URL.
export function rewriteAssetUrls(html: string): string {
  const base = SITE_URL.replace(/\/$/, '')
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
  return `${SITE_URL}/newsletter/unsubscribe?token=${token}`
}

export { SITE_URL, EMAIL_FROM }
