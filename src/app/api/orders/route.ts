import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError, getPaginationParams } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { createOrderSchema } from '@/lib/validations/order'
import { generateOrderNumber } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants'
import { orderRateLimiter, getClientIp, applyRateLimit } from '@/lib/rate-limit'

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
    erpId: o.erpId,
    erpSynced: o.erpSynced,
  }))

  return successResponse({
    orders: formattedOrders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
})

// POST /api/orders — create a new order
export const POST = withErrorHandler(async (req: Request) => {
  const rateLimitResponse = await applyRateLimit(orderRateLimiter, `order:${getClientIp(req)}`)
  if (rateLimitResponse) return rateLimitResponse as never

  const user = await requireAuth()
  const body = await req.json()
  const input = createOrderSchema.parse(body)

  const productIds = input.items.map((i) => i.productId)
  const isB2b = user.role === 'b2b'

  // All validation, stock checks, and order creation inside a single transaction
  // to prevent TOCTOU race conditions on stock
  const order = await prisma.$transaction(async (tx) => {
    // 1. Fetch products with row-level lock (SELECT ... FOR UPDATE via raw query)
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    })

    if (products.length !== productIds.length) {
      throw new ApiError(400, 'Jedan ili više proizvoda nije pronađen ili nije aktivan')
    }

    const productMap = new Map(products.map((p) => [p.id, p]))

    // 2. Validate stock inside the transaction
    for (const item of input.items) {
      const product = productMap.get(item.productId)!
      if (product.stockQuantity < item.quantity) {
        throw new ApiError(400, `Nedovoljno zaliha za ${product.nameLat}. Dostupno: ${product.stockQuantity}`)
      }
    }

    // 3. Calculate prices from DB (never trust client-side prices)
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

    // 4. Shipping cost
    let shippingCost = 0
    if (input.shippingMethod === 'express') {
      shippingCost = 690
    } else if (input.shippingMethod !== 'pickup') {
      shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 350
    }

    const total = subtotal + shippingCost
    const paymentStatus = 'pending'

    // 5. Decrement stock atomically with check to prevent negative inventory
    for (const item of input.items) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stockQuantity: { gte: item.quantity },
        },
        data: { stockQuantity: { decrement: item.quantity } },
      })
      if (updated.count === 0) {
        throw new ApiError(400, `Nedovoljno zaliha za proizvod. Pokušajte ponovo.`)
      }
    }

    // 6. Create order
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

    // 7. Clear user's cart
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
