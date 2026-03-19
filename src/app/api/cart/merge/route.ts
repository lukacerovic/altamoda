import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { z } from 'zod'

const mergeSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.coerce.number().int().min(1).max(999),
    })
  ).max(100),
})

// POST /api/cart/merge — merge guest cart items into user's DB cart on login
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth()
  const body = await req.json()
  const { items } = mergeSchema.parse(body)

  if (items.length === 0) {
    return successResponse({ message: 'Ništa za spajanje' })
  }

  // Get or create cart
  let cart = await prisma.cart.findFirst({
    where: { userId: user.id },
  })
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: user.id },
    })
  }

  // Batch-validate all products in one query (fixes N+1)
  const productIds = items.map((i) => i.productId)
  const validProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true },
  })
  const validProductIds = new Set(validProducts.map((p) => p.id))

  // Get existing cart items in one query
  const existingCartItems = await prisma.cartItem.findMany({
    where: { cartId: cart.id, productId: { in: productIds } },
  })
  const existingMap = new Map(existingCartItems.map((ci) => [ci.productId, ci]))

  // Merge each valid item
  for (const item of items) {
    if (!validProductIds.has(item.productId)) continue

    const existing = existingMap.get(item.productId)

    if (existing) {
      // Sum quantities (not max — guest items should add to existing)
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity },
      })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: item.productId, quantity: item.quantity },
      })
    }
  }

  return successResponse({ message: 'Korpa spojena' })
})
