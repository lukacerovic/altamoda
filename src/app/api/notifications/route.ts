import { prisma } from '@/lib/db'
import { successResponse, withErrorHandler, getPaginationParams } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// Hard cap on per-page size — protects against ?limit=10000 pulling the whole table.
const MAX_LIMIT = 50

// GET /api/notifications — current admin's notifications, newest first.
// Returns list + pagination + unreadCount in a single round trip so the bell
// dropdown never needs a second request.
export const GET = withErrorHandler(async (req: Request) => {
  const user = await requireAdmin()
  const { searchParams } = new URL(req.url)
  const { page, skip } = getPaginationParams(searchParams)
  const requestedLimit = Number(searchParams.get('limit')) || 20
  const limit = Math.min(MAX_LIMIT, Math.max(1, requestedLimit))
  const unreadOnly = searchParams.get('unreadOnly') === 'true'

  const where = { userId: user.id, ...(unreadOnly ? { readAt: null } : {}) }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        readAt: true,
        createdAt: true,
        payload: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ])

  const res = successResponse({
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount,
  })
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  return res
})
