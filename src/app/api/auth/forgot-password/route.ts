import { after } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { passwordResetRateLimiter, getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { sendTransactional, getSiteUrl } from '@/lib/email'
import { passwordResetTemplate, passwordResetSubject, type EmailLang } from '@/lib/email-templates'
import { createResetToken, findUserIdByEmail, RESET_TOKEN_TTL_MS } from '@/lib/password'

const schema = z.object({
  email: z.string().trim().email('auth.errEmailInvalid'),
  lang: z.enum(['sr', 'en', 'ru']).optional(),
})

/**
 * Always answers 200 with the same body, whether or not the email exists,
 * so the endpoint can't be used to find out who has an account.
 */
export const POST = withErrorHandler(async (req: Request) => {
  const ipLimited = await applyRateLimit(passwordResetRateLimiter, `forgot:ip:${getClientIp(req)}`)
  if (ipLimited) return ipLimited as never

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    const code = parsed.error.issues?.[0]?.message || 'auth.errEmailInvalid'
    return errorResponse(code, 400, code)
  }
  const { email, lang = 'sr' } = parsed.data

  const emailLimited = await applyRateLimit(passwordResetRateLimiter, `forgot:email:${email.toLowerCase()}`)
  if (emailLimited) return emailLimited as never

  const userId = await findUserIdByEmail(email)
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, status: true } })
    : null

  if (user && user.status !== 'suspended') {
    const { token, tokenHash } = createResetToken()
    await prisma.$transaction([
      // Only the newest link works.
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
      }),
    ])

    const resetUrl = `${getSiteUrl()}/account/reset-password?token=${encodeURIComponent(token)}`
    const to = user.email
    after(() => sendTransactional({
      to,
      subject: passwordResetSubject(lang as EmailLang),
      html: passwordResetTemplate(resetUrl, lang as EmailLang),
    }).catch((err) => console.error('[email] password reset failed:', err)))
  }

  return successResponse({ sent: true })
})
