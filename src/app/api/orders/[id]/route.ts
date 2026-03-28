import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/orders/[id] — order detail with items + status history
export const GET = withErrorHandler(async (_req: Request, context: unknown) => {
  const user = await requireAuth()
  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
      statusHistory: {
        include: {
          changedByUser: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  if (!order) {
    throw new ApiError(404, 'Porudžbina nije pronađena')
  }

  // Only owner or admin can view
  if (order.userId !== user.id && user.role !== 'admin') {
    throw new ApiError(403, 'Nemate pristup ovoj porudžbini')
  }

  return successResponse({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    shippingCost: Number(order.shippingCost),
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingMethod: order.shippingMethod,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    notes: order.notes,
    erpId: order.erpId,
    erpSynced: order.erpSynced,
    createdAt: order.createdAt,
    user: order.user,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      image: item.product.images[0]?.url ?? '',
    })),
    statusHistory: order.statusHistory.map((h) => ({
      id: h.id,
      status: h.status,
      note: h.note,
      changedBy: h.changedByUser?.name ?? 'Sistem',
      createdAt: h.createdAt,
    })),
  })
})
