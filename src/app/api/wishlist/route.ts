import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { z } from 'zod'

const addWishlistSchema = z.object({
  productId: z.string().min(1),
})

// GET /api/wishlist — list user's wishlist
export const GET = withErrorHandler(async () => {
  const user = await requireAuth()

  const wishlistItems = await prisma.wishlist.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          brand: true,
          images: { where: { isPrimary: true }, take: 1 },
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const items = wishlistItems.map((w) => {
    const avgRating =
      w.product.reviews.length > 0
        ? w.product.reviews.reduce((sum, r) => sum + r.rating, 0) / w.product.reviews.length
        : 0

    return {
      id: w.id,
      productId: w.productId,
      name: w.product.nameLat,
      brand: w.product.brand?.name ?? '',
      price: Number(user.role === 'b2b' && w.product.priceB2b
        ? w.product.priceB2b
        : w.product.priceB2c),
      oldPrice: w.product.oldPrice ? Number(w.product.oldPrice) : null,
      image: w.product.images[0]?.url ?? '',
      rating: Math.round(avgRating * 10) / 10,
      inStock: w.product.stockQuantity > 0,
      slug: w.product.slug,
    }
  })

  return successResponse({ items })
})

// POST /api/wishlist — toggle wishlist item
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth()
  const body = await req.json()
  const { productId } = addWishlistSchema.parse(body)

  // Check product exists
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
  })
  if (!product) {
    throw new ApiError(404, 'Proizvod nije pronađen')
  }

  // Toggle: if exists, remove; if not, add
  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  })

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } })
    return successResponse({ added: false, message: 'Uklonjen sa liste želja' })
  }

  await prisma.wishlist.create({
    data: { userId: user.id, productId },
  })

  return successResponse({ added: true, message: 'Dodat na listu želja' }, 201)
})

// DELETE /api/wishlist — remove by productId query param
export const DELETE = withErrorHandler(async (req: Request) => {
  const user = await requireAuth()
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')

  if (!productId) {
    throw new ApiError(400, 'productId je obavezan')
  }

  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  })

  if (!existing) {
    throw new ApiError(404, 'Stavka nije na listi želja')
  }

  await prisma.wishlist.delete({ where: { id: existing.id } })

  return successResponse({ message: 'Uklonjen sa liste želja' })
})
