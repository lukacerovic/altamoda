import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'

// POST /api/users/check-status — Check if a user account is pending/suspended
// Used by the login page to show the correct error message
export const POST = withErrorHandler(async (req: Request) => {
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
