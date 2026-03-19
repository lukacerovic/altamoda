import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { addToCartSchema } from '@/lib/validations/cart'

// GET /api/cart — get current user's cart
export const GET = withErrorHandler(async () => {
  const user = await requireAuth()

  let cart = await prisma.cart.findFirst({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  })

  if (!cart) {
    return successResponse({ items: [] })
  }

  const items = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.nameLat,
    brand: item.product.brand?.name ?? '',
    price: Number(user.role === 'b2b' && item.product.priceB2b
      ? item.product.priceB2b
      : item.product.priceB2c),
    quantity: item.quantity,
    image: item.product.images[0]?.url ?? '',
    sku: item.product.sku,
    stockQuantity: item.product.stockQuantity,
  }))

  return successResponse({ items })
})

// POST /api/cart — add item to cart
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth()
  const body = await req.json()
  const { productId, quantity } = addToCartSchema.parse(body)

  // Verify product exists and is active
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
  })
  if (!product) {
    throw new ApiError(404, 'Proizvod nije pronađen')
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

  // Upsert cart item
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  })

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    })
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    })
  }

  return successResponse({ message: 'Proizvod dodat u korpu' }, 201)
})
