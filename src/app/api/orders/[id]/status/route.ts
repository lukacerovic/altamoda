import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { updateStatusSchema } from '@/lib/validations/order'

// Valid status transitions (state machine)
const VALID_TRANSITIONS: Record<string, string[]> = {
  novi: ['u_obradi', 'otkazano'],
  u_obradi: ['isporuceno', 'otkazano'],
  isporuceno: [],
  otkazano: [],
}

// PATCH /api/orders/[id]/status — admin: update order status
export const PATCH = withErrorHandler(async (req: Request, context: unknown) => {
  const user = await requireAdmin()
  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const body = await req.json()
  const { status, note } = updateStatusSchema.parse(body)

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) {
    throw new ApiError(404, 'Porudžbina nije pronađena')
  }

  // Validate state transition
  const allowedNext = VALID_TRANSITIONS[order.status] ?? []
  if (!allowedNext.includes(status)) {
    throw new ApiError(400, `Nije moguća promena statusa iz "${order.status}" u "${status}"`)
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { status },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        status,
        changedBy: user.id,
        note,
      },
    }),
  ])

  return successResponse({ message: 'Status ažuriran', status })
})
