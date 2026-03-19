import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError, getPaginationParams } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { createReviewSchema } from '@/lib/validations/review'

// GET /api/reviews?productId=xxx — get reviews for a product
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')

  if (!productId) {
    throw new ApiError(400, 'productId je obavezan')
  }

  const { page, limit, skip } = getPaginationParams(searchParams)

  const [reviews, total, avgResult] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { productId } }),
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    }),
  ])

  const avgRating = avgResult._avg.rating ?? 0

  return successResponse({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      createdAt: r.createdAt,
      user: r.user,
    })),
    avgRating: Math.round(avgRating * 10) / 10,
    count: total,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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

  // Check if user already reviewed — return error instead of upsert
  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
  })

  if (existing) {
    throw new ApiError(409, 'Već ste ocenili ovaj proizvod')
  }

  const review = await prisma.review.create({
    data: { productId, userId: user.id, rating },
  })

  return successResponse({
    id: review.id,
    rating: review.rating,
    message: 'Recenzija sačuvana',
  }, 201)
})
