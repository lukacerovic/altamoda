import type { Prisma, SyncDirection, SyncStatus } from '@prisma/client'

import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, getPaginationParams } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

/**
 * GET /api/admin/erp/sync/logs — paginated list of ErpSyncLog entries.
 *
 * Query params: page, limit, status?, syncType?, direction?
 */
export const GET = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const url = new URL(req.url)
  const { page, limit, skip } = getPaginationParams(url.searchParams)

  const status = url.searchParams.get('status')
  const syncType = url.searchParams.get('syncType')
  const direction = url.searchParams.get('direction')

  const where: Prisma.ErpSyncLogWhereInput = {
    ...(status && (status === 'success' || status === 'failed' || status === 'in_progress')
      ? { status: status as SyncStatus }
      : {}),
    ...(syncType ? { syncType } : {}),
    ...(direction && (direction === 'inbound' || direction === 'outbound')
      ? { direction: direction as SyncDirection }
      : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.erpSyncLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.erpSyncLog.count({ where }),
  ])

  return successResponse({
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})
