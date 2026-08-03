import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { requireAuth } from '@/lib/auth-helpers'
import { z } from 'zod'

const mergeSchema = z.object({
  productIds: z.array(z.string().min(1)).max(200),
})

// POST /api/wishlist/merge — merge guest (localStorage) wishlist into the
// user's DB wishlist on login/registration. Union semantics: existing items
// are kept, duplicates skipped.
export const POST = withErrorHandler(async (req: Request) => {
  const user = await requireAuth()
  const body = await req.json()
  const { productIds } = mergeSchema.parse(body)

  if (productIds.length === 0) {
    return successResponse({ message: 'Ništa za spajanje' })
  }

  const validProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true },
  })

  await prisma.wishlist.createMany({
    data: validProducts.map((p) => ({ userId: user.id, productId: p.id })),
    skipDuplicates: true,
  })

  const count = await prisma.wishlist.count({ where: { userId: user.id } })

  return successResponse({ message: 'Lista želja spojena', count })
})
