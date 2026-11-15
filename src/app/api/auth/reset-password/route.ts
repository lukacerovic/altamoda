import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { passwordResetRateLimiter, getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { hashPassword, hashResetToken } from '@/lib/password'

const schema = z.object({
  token: z.string().min(20, 'auth.resetLinkInvalid'),
  password: z.string().min(6, 'auth.errPasswordMin'),
})

export const POST = withErrorHandler(async (req: Request) => {
  const limited = await applyRateLimit(passwordResetRateLimiter, `reset:ip:${getClientIp(req)}`)
  if (limited) return limited as never

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    const code = parsed.error.issues?.[0]?.message || 'auth.resetLinkInvalid'
    return errorResponse(code, 400, code)
  }
  const { token, password } = parsed.data

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  })
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return errorResponse('auth.resetLinkInvalid', 400, 'auth.resetLinkInvalid')
  }

  const passwordHash = await hashPassword(password)
  // Claim the token atomically so a double submit can't use it twice.
  const claimed = await prisma.passwordResetToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  })
  if (claimed.count !== 1) {
    return errorResponse('auth.resetLinkInvalid', 400, 'auth.resetLinkInvalid')
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, legacyPasswordHash: null },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, id: { not: record.id } } }),
  ])

  return successResponse({ reset: true })
})
