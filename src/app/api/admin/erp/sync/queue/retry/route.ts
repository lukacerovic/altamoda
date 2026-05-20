import { z } from 'zod'

import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { requeueFailed } from '@/lib/pantheon/sync-outbound'

const retrySchema = z.object({ id: z.string().min(1) })

/**
 * POST /api/admin/erp/sync/queue/retry — reset a failed/retrying queue row
 * to pending so the next worker run picks it up.
 *
 * Body: { id: "<queueItemId>" }
 */
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const body = await req.json().catch(() => ({}))
  const { id } = retrySchema.parse(body)

  const item = await prisma.erpSyncQueue.findUnique({ where: { id } })
  if (!item) throw new ApiError(404, 'Stavka u redu nije pronađena')

  await requeueFailed(id)
  return successResponse({ id, status: 'pending' })
})
