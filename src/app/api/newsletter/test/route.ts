import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { sendEmail } from '@/lib/email'
import { welcomeTemplate } from '@/lib/email-templates'

// POST /api/newsletter/test — send a test email (admin only)
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return Response.json({ success: false, error: 'Email je obavezan' }, { status: 400 })
  }

  await sendEmail({
    to: email,
    subject: 'Altamoda - Test Email ✓',
    html: welcomeTemplate(email),
  })

  return successResponse({ message: `Test email poslat na ${email}` })
})
