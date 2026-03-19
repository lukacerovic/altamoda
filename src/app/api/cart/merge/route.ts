import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { z } from 'zod'

const mergeSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.coerce.number().int().min(1),
    })
  ),
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

  // Merge each item
  for (const item of items) {
    // Verify product exists
    const product = await prisma.product.findFirst({
      where: { id: item.productId, isActive: true },
    })
    if (!product) continue

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
    })

    if (existing) {
      // Keep the higher quantity
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.max(existing.quantity, item.quantity) },
      })
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: item.productId, quantity: item.quantity },
      })
    }
  }

  return successResponse({ message: 'Korpa spojena' })
})
