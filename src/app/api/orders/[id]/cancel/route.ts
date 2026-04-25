import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { getRouteParams } from '@/lib/route-utils'

// Only these states allow self-cancel — once an order is in progress or delivered
// it needs human follow-up (shipping, refund), not a click.
const CANCELLABLE_STATES = new Set(['novi'])

// POST /api/orders/[id]/cancel — client-initiated cancellation of own order.
// Transactional: flips status → 'otkazano', logs status history, and returns stock.
export const POST = withErrorHandler(async (_req: Request, context: unknown) => {
  const user = await requireAuth()
  const { id } = await getRouteParams<{ id: string }>(context)

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true, userId: true, status: true, orderNumber: true,
      items: { select: { productId: true, quantity: true } },
    },
  })

  if (!order) throw new ApiError(404, 'Porudžbina nije pronađena')
  if (order.userId !== user.id && user.role !== 'admin') {
    throw new ApiError(403, 'Ne možete otkazati tuđu porudžbinu')
  }
  if (!CANCELLABLE_STATES.has(order.status)) {
    throw new ApiError(409, 'Ovu porudžbinu više nije moguće otkazati')
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: { status: 'otkazano' },
    })
    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        status: 'otkazano',
        changedBy: user.id,
        note: 'Otkazano od strane korisnika',
      },
    })
    // Return stock for each item. updateMany is intentional — it ensures atomic
    // writes and avoids the findUnique/update round-trip per item.
    for (const it of order.items) {
      await tx.product.updateMany({
        where: { id: it.productId },
        data: { stockQuantity: { increment: it.quantity } },
      })
    }
  })

  return successResponse({ id, status: 'otkazano', orderNumber: order.orderNumber })
})
