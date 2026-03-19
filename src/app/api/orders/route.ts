import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError, getPaginationParams } from '@/lib/api-utils'
import { requireAuth, getCurrentUser } from '@/lib/auth-helpers'
import { createOrderSchema } from '@/lib/validations/order'
import { generateOrderNumber } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants'

// GET /api/orders — list orders (user's own, or admin sees all)
export const GET = withErrorHandler(async (req: Request) => {
  const user = await requireAuth()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = getPaginationParams(searchParams)

  const where = user.role === 'admin' ? {} : { userId: user.id }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    subtotal: Number(o.subtotal),
    discountAmount: Number(o.discountAmount),
    shippingCost: Number(o.shippingCost),
    total: Number(o.total),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    itemCount: o.items.length,
    createdAt: o.createdAt,
    user: o.user,
  }))

  return successResponse({
    orders: formattedOrders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

// POST /api/orders — create a new order
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth()
  const body = await req.json()
  const input = createOrderSchema.parse(body)

  // 1. Validate stock & fetch product prices
  const productIds = input.items.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  })

  if (products.length !== productIds.length) {
    throw new ApiError(400, 'Jedan ili više proizvoda nije pronađen ili nije aktivan')
  }

  const productMap = new Map(products.map((p) => [p.id, p]))

  for (const item of input.items) {
    const product = productMap.get(item.productId)!
    if (product.stockQuantity < item.quantity) {
      throw new ApiError(400, `Nedovoljno zaliha za ${product.nameLat}. Dostupno: ${product.stockQuantity}`)
    }
  }

  // 2. Calculate prices
  const isB2b = user.role === 'b2b'
  const orderItems = input.items.map((item) => {
    const product = productMap.get(item.productId)!
    const unitPrice = isB2b && product.priceB2b
      ? Number(product.priceB2b)
      : Number(product.priceB2c)
    return {
      productId: product.id,
      productName: product.nameLat,
      productSku: product.sku,
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
    }
  })

  const subtotal = orderItems.reduce((sum, i) => sum + i.totalPrice, 0)

  // 3. Shipping cost
  let shippingCost = 0
  if (input.shippingMethod === 'express') {
    shippingCost = 690
  } else if (input.shippingMethod !== 'pickup') {
    shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 350
  }

  const total = subtotal + shippingCost

  // 4. B2B invoice: paymentStatus = 'pending'
  const paymentStatus = input.paymentMethod === 'invoice' ? 'pending' : 'pending'

  // 5. Create order in a transaction
  const order = await prisma.$transaction(async (tx) => {
    // Decrement stock
    for (const item of input.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      })
    }

    // Create order
    const createdOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        status: 'novi',
        subtotal,
        discountAmount: 0,
        shippingCost,
        total,
        paymentMethod: input.paymentMethod,
        paymentStatus,
        shippingMethod: input.shippingMethod,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress ?? input.shippingAddress,
        notes: input.notes,
        items: {
          create: orderItems,
        },
        statusHistory: {
          create: {
            status: 'novi',
            changedBy: user.id,
            note: 'Porudžbina kreirana',
          },
        },
      },
      include: { items: true },
    })

    // Clear user's cart
    const cart = await tx.cart.findFirst({ where: { userId: user.id } })
    if (cart) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
    }

    return createdOrder
  })

  return successResponse({
    id: order.id,
    orderNumber: order.orderNumber,
    total: Number(order.total),
    status: order.status,
    itemCount: order.items.length,
  }, 201)
})
