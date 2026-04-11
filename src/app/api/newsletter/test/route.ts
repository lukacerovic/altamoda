import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { sendTransactional, rewriteAssetUrls } from '@/lib/email'
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

  const limited = applyRateLimit(newsletterRateLimiter, `newsletter-test:${admin.id}`)
  if (limited) return limited as never

  const { email, subject, html, options } = testSendSchema.parse(await req.json())

  const finalSubject = subject?.trim() ? `[TEST] ${subject.trim()}` : 'Altamoda - Test Email ✓'
  const rendered = html?.trim()
    ? generateEmailPreview(html, options)
    : welcomeTemplate(email)

  await sendTransactional({
    to: email,
    subject: finalSubject,
    html: rewriteAssetUrls(rendered),
  })

  return successResponse({ message: `Test email poslat na ${email}` })
})
