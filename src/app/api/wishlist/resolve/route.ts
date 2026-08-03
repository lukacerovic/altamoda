import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { z } from 'zod'

const resolveSchema = z.object({
  productIds: z.array(z.string().min(1)).max(200),
})

// POST /api/wishlist/resolve — public endpoint that turns a guest's locally
// stored wishlist (product IDs) into displayable items. Guests always get
// B2C prices; B2B prices are never exposed here.
export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json()
  const { productIds } = resolveSchema.parse(body)

  if (productIds.length === 0) {
    return successResponse({ items: [] })
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: {
      brand: true,
      images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 },
    },
  })

  const ratings = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
  })
  const ratingMap = new Map(ratings.map((r) => [r.productId, r._avg.rating ?? 0]))

  // Preserve the caller's ordering (most recently added first on the client).
  const byId = new Map(products.map((p) => [p.id, p]))
  const items = productIds
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      id: p.id, // no Wishlist row exists for guests; product id doubles as key
      productId: p.id,
      name: p.nameLat,
      brand: p.brand?.name ?? '',
      price: Number(p.priceB2c),
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      image: p.images[0]?.url ?? '',
      rating: Math.round((ratingMap.get(p.id) ?? 0) * 10) / 10,
      inStock: p.stockQuantity > 0,
      slug: p.slug,
    }))

  return successResponse({ items })
})
