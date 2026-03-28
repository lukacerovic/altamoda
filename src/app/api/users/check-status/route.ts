import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { checkStatusRateLimiter, getClientIp, applyRateLimit } from '@/lib/rate-limit'

// POST /api/users/check-status — Check if a user account is pending/suspended
// Used by the login page to show the correct error message
export const POST = withErrorHandler(async (req: Request) => {
  const rateLimitResponse = applyRateLimit(checkStatusRateLimiter, `check-status:${getClientIp(req)}`)
  if (rateLimitResponse) return rateLimitResponse as never

  const body = await req.json()
  const email = body.email?.trim()

  if (!email) {
    return errorResponse('Email je obavezan', 400)
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { status: true, role: true },
  })

  if (!user) {
    // Don't reveal whether user exists — return generic response
    return successResponse({ status: 'unknown' })
  }

  return successResponse({ status: user.status, role: user.role })
})
