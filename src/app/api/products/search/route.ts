import { prisma } from '@/lib/db'
import { successResponse, withErrorHandler } from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth-helpers'

// GET /api/products/search?q=majirel — Autocomplete (top 5)
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return successResponse([])
  }

  const user = await getCurrentUser()
  const role = user?.role

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(role === 'b2c' ? { isProfessional: false } : {}),
      OR: [
        { nameLat: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { brand: { name: { contains: q, mode: 'insensitive' } } },
      ],
    },
    include: {
      brand: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 5,
    orderBy: { nameLat: 'asc' },
  })

  const results = products.map(p => ({
    id: p.id,
    name: p.nameLat,
    slug: p.slug,
    sku: p.sku,
    brand: p.brand?.name,
    price: role === 'b2b' && p.priceB2b ? Number(p.priceB2b) : Number(p.priceB2c),
    image: p.images[0]?.url || null,
    isProfessional: p.isProfessional,
  }))

  return successResponse(results)
})
