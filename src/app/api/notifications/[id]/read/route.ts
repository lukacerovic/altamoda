import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { getRouteParams } from '@/lib/route-utils'

// PATCH /api/notifications/[id]/read — mark a single notification as read.
// No-op if already read. Returns 404 if the row isn't owned by the caller —
// this both enforces authorization and avoids leaking whether the id exists.
export const PATCH = withErrorHandler(async (_req: Request, context: unknown) => {
  const user = await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  // updateMany scoped by both id and userId so a malicious admin can't mark
  // someone else's row read; returns count without throwing on no-match.
  const result = await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { readAt: new Date() },
  })

  if (result.count === 0) {
    return errorResponse('Obaveštenje nije pronađeno', 404)
  }

  const res = successResponse({ id, readAt: new Date() })
  res.headers.set('Cache-Control', 'no-store, must-revalidate')
  return res
})
