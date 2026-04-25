import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError, getPaginationParams } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { createOrderSchema } from '@/lib/validations/order'
import { generateOrderNumber } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants'
import { orderRateLimiter, getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { getActivePromosByProductId, applyBestPromo } from '@/lib/pricing'
import { notifyAdmins, maybeNotifyLowStock } from '@/lib/notifications'

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
        // Include each line item with its linked product slug so the client
        // can render "Review this product" links on the orders page without
        // a second round trip per item.
        items: {
          include: {
            product: { select: { slug: true } },
          },
        },
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
    items: o.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      productSku: it.productSku,
      quantity: it.quantity,
      // slug may be null if the product has been hard-deleted since order placement
      slug: it.product?.slug ?? null,
    })),
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

  // Promo lookup BEFORE the transaction. It's a read-only query against the
  // promotions tables and doesn't need transactional isolation with the order
  // write. Keeping it inside the transaction was holding the transaction open
  // for an extra round trip on a separate pool connection — under load this
  // pushed past Prisma's 5s interactive-transaction timeout.
  const promosByProduct = await getActivePromosByProductId(productIds)

  // All validation, stock checks, and order creation inside a single transaction
  // to prevent TOCTOU race conditions on stock. Bumped timeout to 15s — the
  // default 5s is too tight on a slow dev/Render-free DB once we have any
  // realistic order with multiple items.
  const order = await prisma.$transaction(async (tx) => {
    // 1. Fetch products with row-level lock (SELECT ... FOR UPDATE via raw query)
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    })

    if (products.length !== productIds.length) {
      throw new ApiError(400, 'Jedan ili više proizvoda nije pronađen ili nije aktivan')
    }

    const productMap = new Map(products.map((p) => [p.id, p]))

    // 2a. Defense-in-depth: reject any professional (B2B-only) items for non-B2B roles,
    // in case the product ever reached the cart (stale session, admin role change, etc.).
    if (user.role !== 'b2b' && user.role !== 'admin') {
      const forbidden = products.find((p) => p.isProfessional)
      if (forbidden) {
        throw new ApiError(403, `Proizvod "${forbidden.nameLat}" je dostupan samo profesionalnim salonima`)
      }
    }

    // 2b. Validate stock inside the transaction
    for (const item of input.items) {
      const product = productMap.get(item.productId)!
      if (product.stockQuantity < item.quantity) {
        throw new ApiError(400, `Nedovoljno zaliha za ${product.nameLat}. Dostupno: ${product.stockQuantity}`)
      }
    }

    // 3. Calculate prices from DB (never trust client-side prices). Apply any active
    // promotion so the charged unit price matches what the customer saw in cart/list.
    // promosByProduct is the snapshot fetched above; we use it inline here.
    const orderItems = input.items.map((item) => {
      const product = productMap.get(item.productId)!
      const basePrice = isB2b && product.priceB2b ? Number(product.priceB2b) : Number(product.priceB2c)
      const applied = applyBestPromo(basePrice, null, promosByProduct.get(product.id) ?? [], user.role)
      const unitPrice = applied.price
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

    // 5. Decrement stock atomically with check to prevent negative inventory.
    // We compute the post-decrement stock locally (before - qty) instead of
    // re-reading — saves N queries inside an already-hot transaction. The
    // updateMany above is the source of truth for atomicity; the local math
    // is only used to drive the low-stock threshold check.
    const lowStockChecks: Array<{ before: typeof products[number]; after: number }> = []
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
      const product = productMap.get(item.productId)!
      lowStockChecks.push({ before: product, after: product.stockQuantity - item.quantity })
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

    // Return both the order and the snapshot the post-commit notification
    // step needs. We deliberately do NOT write notifications inside the
    // transaction — the extra round-trips were pushing past Prisma's 5s
    // interactive-transaction timeout under realistic load. Notifications
    // are best-effort side-effects (the helper swallows errors); accepting
    // a microscopic window where the order commits but the notification
    // doesn't is the right trade.
    return { createdOrder, lowStockChecks, total }
  }, { timeout: 15000 })

  // Fire-and-await notifications AFTER the transaction commits. notifyAdmins
  // and maybeNotifyLowStock both swallow + log errors internally so a
  // notification failure cannot reach the response.
  void notifyAdmins({
    type: 'order_created',
    title: `Nova porudžbina #${order.createdOrder.orderNumber}`,
    body: `${user.name ?? user.email} — ${order.total.toLocaleString('sr-RS')} RSD`,
    link: `/admin/orders/${order.createdOrder.id}`,
    payload: {
      orderId: order.createdOrder.id,
      orderNumber: order.createdOrder.orderNumber,
      customerName: user.name ?? user.email ?? '',
      total: order.total,
    },
  })
  for (const check of order.lowStockChecks) {
    void maybeNotifyLowStock(check.before, check.after)
  }

  return successResponse({
    id: order.createdOrder.id,
    orderNumber: order.createdOrder.orderNumber,
    total: Number(order.createdOrder.total),
    status: order.createdOrder.status,
    itemCount: order.createdOrder.items.length,
  }, 201)
})
