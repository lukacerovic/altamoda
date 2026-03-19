import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAuth, getCurrentUser } from '@/lib/auth-helpers'
import { createReviewSchema } from '@/lib/validations/review'

// GET /api/reviews?productId=xxx — get reviews for a product
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')

  if (!productId) {
    throw new ApiError(400, 'productId je obavezan')
  }

  const reviews = await prisma.review.findMany({
    where: { productId },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return successResponse({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      createdAt: r.createdAt,
      user: r.user,
    })),
    avgRating: Math.round(avgRating * 10) / 10,
    count: reviews.length,
  })
})

// POST /api/reviews — create or update a review (upsert)
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth()
  const body = await req.json()
  const { productId, rating } = createReviewSchema.parse(body)

  // Verify product exists
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
  })
  if (!product) {
    throw new ApiError(404, 'Proizvod nije pronađen')
  }

  // Upsert — one review per user per product
  const review = await prisma.review.upsert({
    where: {
      productId_userId: { productId, userId: user.id },
    },
    update: { rating },
    create: { productId, userId: user.id, rating },
  })

  return successResponse({
    id: review.id,
    rating: review.rating,
    message: 'Recenzija sačuvana',
  }, 201)
})
