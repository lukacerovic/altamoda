import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { updateStatusSchema } from '@/lib/validations/order'

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
