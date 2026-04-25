import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth-helpers'

// GET /api/reviews/eligibility?productId=xxx
// Returns { canReview } so the UI can hide the rate-this-product button for users
// who haven't ordered the product. The POST /api/reviews handler enforces the same
// check — this endpoint is UX only.
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  if (!productId) throw new ApiError(400, 'productId je obavezan')

  const user = await getCurrentUser()
  if (!user) return successResponse({ canReview: false, reason: 'unauthenticated' })

  const match = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: user.id, status: { not: 'otkazano' } },
    },
    select: { id: true },
  })

  return successResponse({ canReview: match !== null, reason: match ? null : 'not_purchased' })
})
