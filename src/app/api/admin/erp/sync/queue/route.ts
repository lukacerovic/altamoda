import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, getPaginationParams } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

/**
 * GET /api/admin/erp/sync/queue — paginated view of the ErpSyncQueue.
 *
 * Query params: page, limit, status? (pending | retrying | failed | done)
 */
export const GET = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const url = new URL(req.url)
  const { page, limit, skip } = getPaginationParams(url.searchParams)

  const status = url.searchParams.get('status')
  const where = status ? { status } : {}

  const [items, total] = await Promise.all([
    prisma.erpSyncQueue.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.erpSyncQueue.count({ where }),
  ])

  return successResponse({
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})
