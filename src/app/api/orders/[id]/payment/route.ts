import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { getRouteParams } from '@/lib/route-utils'

// POST /api/orders/[id]/payment — admin: confirm that an "Uplatnicom" order's
// payment showed up on the bank statement. Card payments are settled by the
// VPOS webhook and are never confirmed by hand.
export const POST = withErrorHandler(async (_req: Request, context: unknown) => {
  const user = await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true, paymentMethod: true, paymentStatus: true },
  })
  if (!order) throw new ApiError(404, 'Porudžbina nije pronađena')
  if (order.paymentMethod !== 'bank_transfer') {
    throw new ApiError(400, 'Ručna potvrda uplate važi samo za plaćanje uplatnicom')
  }
  if (order.status === 'otkazano') {
    throw new ApiError(400, 'Porudžbina je otkazana')
  }

  const paidAt = new Date()
  await prisma.$transaction(async (tx) => {
    // Conditional update so a double click can't log the confirmation twice.
    const updated = await tx.order.updateMany({
      where: { id, paymentStatus: 'pending' },
      data: { paymentStatus: 'paid', paidAt },
    })
    if (updated.count === 0) throw new ApiError(409, 'Uplata je već potvrđena')
    await tx.orderStatusHistory.create({
      data: { orderId: id, status: order.status, changedBy: user.id, note: 'Uplata potvrđena (uplatnica)' },
    })
  })

  return successResponse({ message: 'Uplata potvrđena', paymentStatus: 'paid', paidAt })
})
