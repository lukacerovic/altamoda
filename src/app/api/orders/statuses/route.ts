import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/orders/statuses — lightweight poll target for the client account page.
// Returns only id/status/updatedAt for the current user's non-terminal orders so
// the UI can refresh status chips without re-fetching the full /api/orders list.
export const GET = withErrorHandler(async () => {
  const user = await requireAuth()

  const rows = await prisma.order.findMany({
    where: {
      userId: user.id,
      status: { notIn: ['isporuceno', 'otkazano'] },
    },
    select: { id: true, orderNumber: true, status: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return successResponse({ orders: rows })
})
