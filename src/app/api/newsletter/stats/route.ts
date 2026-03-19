import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// GET /api/newsletter/stats — subscriber stats (admin only)
export const GET = withErrorHandler(async () => {
  await requireAdmin()

  const [totalActive, b2bCount, b2cCount] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { isSubscribed: true } }),
    prisma.newsletterSubscriber.count({ where: { isSubscribed: true, segment: 'b2b' } }),
    prisma.newsletterSubscriber.count({ where: { isSubscribed: true, segment: 'b2c' } }),
  ])

  return successResponse({ totalActive, b2bCount, b2cCount })
})
