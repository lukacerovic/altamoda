import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { updateCartItemSchema } from '@/lib/validations/cart'

// PUT /api/cart/[itemId] — update quantity
export const PUT = withErrorHandler(async (req: Request, context: unknown) => {
  const user = await requireAuth()
  const { itemId } = (context as { params: Promise<{ itemId: string }> }).params
    ? await (context as { params: Promise<{ itemId: string }> }).params
    : (context as { params: { itemId: string } }).params

  const body = await req.json()
  const { quantity } = updateCartItemSchema.parse(body)

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  })

  if (!item || item.cart.userId !== user.id) {
    throw new ApiError(404, 'Stavka nije pronađena')
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  })

  return successResponse({ message: 'Količina ažurirana' })
})

// DELETE /api/cart/[itemId] — remove item
export const DELETE = withErrorHandler(async (_req: Request, context: unknown) => {
  const user = await requireAuth()
  const { itemId } = (context as { params: Promise<{ itemId: string }> }).params
    ? await (context as { params: Promise<{ itemId: string }> }).params
    : (context as { params: { itemId: string } }).params

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  })

  if (!item || item.cart.userId !== user.id) {
    throw new ApiError(404, 'Stavka nije pronađena')
  }

  await prisma.cartItem.delete({ where: { id: itemId } })

  return successResponse({ message: 'Stavka uklonjena' })
})
