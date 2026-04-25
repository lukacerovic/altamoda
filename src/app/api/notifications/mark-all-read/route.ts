import { prisma } from '@/lib/db'
import { successResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// POST /api/notifications/mark-all-read — mark every unread notification of
// the current admin as read. Single indexed UPDATE.
export const POST = withErrorHandler(async () => {
  const user = await requireAdmin()
  const result = await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })
  const res = successResponse({ updated: result.count })
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  return res
})
