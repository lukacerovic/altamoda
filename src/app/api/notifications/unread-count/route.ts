import { prisma } from '@/lib/db'
import { successResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// GET /api/notifications/unread-count — bell-icon poll endpoint.
// Single indexed COUNT(*); response is ~50 bytes. Keep it that way — this
// fires every 30s on every open admin tab.
export const GET = withErrorHandler(async () => {
  const user = await requireAdmin()
  const count = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  })
  const res = successResponse({ count })
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  return res
})
