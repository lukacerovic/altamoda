import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { sendBulk, rewriteAssetUrls } from '@/lib/email'
import { welcomeTemplate } from '@/lib/email-templates'
import { generateEmailPreview } from '@/lib/email-preview'
import { testSendSchema } from '@/lib/validations/newsletter'
import { newsletterRateLimiter, applyRateLimit } from '@/lib/rate-limit'

// POST /api/newsletter/test — send a test email (admin only).
// When `html` is provided, runs through the same render pipeline as the
// editor preview so the inbox result matches what the admin sees on screen.
// Without `html`, sends the generic welcome template (used by the global
// "Pošalji test email" button).
export const POST = withErrorHandler(async (req: Request) => {
  const admin = await requireAdmin()

  const limited = await applyRateLimit(newsletterRateLimiter, `newsletter-test:${admin.id}`)
  if (limited) return limited as never

  const body = testSendSchema.parse(await req.json())

  const finalSubject = body.subject?.trim() ? `[TEST] ${body.subject.trim()}` : 'Altamoda - Test Email ✓'
  const rendered = body.html?.trim()
    ? generateEmailPreview(body.html, body.options)
    : welcomeTemplate(body.email)

  const finalHtml = rewriteAssetUrls(rendered)
  const result = await sendBulk([{ to: body.email, subject: finalSubject, html: finalHtml }], { total: 1 })

  if (result.sent === 0) {
    const reason = result.failures[0]?.error ?? 'Unknown SMTP error'
    return errorResponse(`SMTP greška: ${reason}`, 502)
  }

  return successResponse({ message: `Test email poslat na ${body.email} (via SMTP)` })
})
