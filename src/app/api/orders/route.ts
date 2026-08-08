import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError, getPaginationParams } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { createOrderSchema } from '@/lib/validations/order'
import { generateOrderNumber } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants'
import { orderRateLimiter, getClientIp, applyRateLimit } from '@/lib/rate-limit'
import { getActivePromosByProductId, applyBestPromo } from '@/lib/pricing'
import { enqueueOrderSync } from '@/lib/pantheon/sync-outbound'
import { VPOS_ENABLED } from '@/lib/payments/vpos-config'
import { sendEmail, rewriteAssetUrls } from '@/lib/email'
import { orderConfirmationTemplate } from '@/lib/email-templates'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Platna kartica',
  bank_transfer: 'Bankovna uplata',
  cash_on_delivery: 'Plaćanje pouzećem',
  invoice: 'Plaćanje po fakturi',
}

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
    guest: o.userId ? null : { name: o.guestName, email: o.guestEmail, phone: o.guestPhone },
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

  // Placing an order requires an account: the viewer's role decides which
  // products they may order and at which price, so guests are sent to login
  // (the checkout draft brings them back to the same step afterwards).
  const user = await requireAuth()
  const body = await req.json()
  const input = createOrderSchema.parse(body)

  const role = user.role
  const productIds = input.items.map((i) => i.productId)
  const isB2b = role === 'b2b'

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

    // 2a. Defense-in-depth: reject any professional (B2B-only) items for non-B2B roles
    // (including guests), in case the product ever reached the cart.
    if (role !== 'b2b' && role !== 'admin') {
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
    const promosByProduct = await getActivePromosByProductId(productIds)
    const orderItems = input.items.map((item) => {
      const product = productMap.get(item.productId)!
      const basePrice = isB2b && product.priceB2b ? Number(product.priceB2b) : Number(product.priceB2c)
      const applied = applyBestPromo(basePrice, null, promosByProduct.get(product.id) ?? [], role)
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

    // 8. Enqueue outbound Pantheon sync. Same transaction so the queue row and
    // the order are written atomically — no orphan orders, no orphan queue rows.
    await enqueueOrderSync(createdOrder.id, tx)

    return createdOrder
  }, {
    // The default interactive-transaction timeout (5s) can be exceeded on a cold
    // dev DB connection (first request after server start, lazy pool connect).
    maxWait: 10_000,
    timeout: 20_000,
  })

  // Best-effort confirmation email — failure must not fail the request.
  const recipientEmail = user.email
  if (recipientEmail) {
    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const sendConfirmation = async () => {
      const primaryImages = await prisma.productImage.findMany({
        where: { productId: { in: order.items.map((i) => i.productId) }, isPrimary: true },
        select: { productId: true, url: true },
      })
      const imageByProduct = new Map(primaryImages.map((img) => [img.productId, img.url]))
      const addr = input.shippingAddress
      await sendEmail({
        to: recipientEmail,
        subject: `Potvrda porudžbine ${order.orderNumber}`,
        html: rewriteAssetUrls(orderConfirmationTemplate({
          orderNumber: order.orderNumber,
          items: order.items.map((i) => ({
            name: escapeHtml(i.productName),
            quantity: i.quantity,
            totalPrice: `${Number(i.totalPrice).toLocaleString('sr-RS')} RSD`,
            image: imageByProduct.get(i.productId) ?? null,
          })),
          total: `${Number(order.total).toLocaleString('sr-RS')} RSD`,
          paymentMethod: PAYMENT_METHOD_LABELS[input.paymentMethod] ?? input.paymentMethod,
          paymentConfirmed: order.paymentStatus === 'paid',
          shippingAddress: escapeHtml(`${addr.street}, ${addr.postalCode} ${addr.city}, ${addr.country}`),
          notes: input.notes ? escapeHtml(input.notes) : null,
        })),
      })
    }
    sendConfirmation().catch((err) => console.error('Order confirmation email failed:', err))
  }

  // Card orders go through the VPOS hosted payment page (when enabled). The client
  // redirects here instead of the confirmation page, and keeps the cart until paid.
  const needsCardPayment = input.paymentMethod === 'card' && VPOS_ENABLED

  return successResponse({
    id: order.id,
    orderNumber: order.orderNumber,
    total: Number(order.total),
    status: order.status,
    itemCount: order.items.length,
    payment: needsCardPayment
      ? { provider: 'vpos', redirectUrl: `/checkout/pay/${order.orderNumber}` }
      : null,
  }, 201)
})
