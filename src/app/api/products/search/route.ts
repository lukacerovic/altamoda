import { prisma } from '@/lib/db'
import { successResponse, withErrorHandler } from '@/lib/api-utils'
import { getCurrentUser } from '@/lib/auth-helpers'
import { findFuzzyProductIds } from '@/lib/fuzzy-search'
import { fetchActivePromosByProduct, applyBestPromo } from '@/lib/promotions'

// GET /api/products/search?q=majirel&limit=10 — Autocomplete
// Defaults to 10 results so users see multiple matches; admin may request up to 50.
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return successResponse([])
  }

  const user = await getCurrentUser()
  const role = user?.role

  const requestedLimit = Number(searchParams.get('limit'))
  const defaultLimit = 10
  const maxLimit = role === 'admin' ? 50 : 20
  const take = Math.min(
    maxLimit,
    Math.max(1, Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : defaultLimit),
  )

  // Trigram + ILIKE candidates, already ranked by similarity DESC
  const candidateIds = await findFuzzyProductIds(q, Math.max(50, take * 10))
  if (candidateIds.length === 0) {
    return successResponse([])
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: candidateIds },
      ...(role === 'admin' ? {} : { isActive: true }),
      ...(role === 'b2c' ? { isProfessional: false } : {}),
    },
    include: {
      brand: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
  })

  // Restore similarity ranking (findMany with `in` does not preserve input order)
  const orderMap = new Map(candidateIds.map((id, i) => [id, i]))
  products.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))

  const top = products.slice(0, take)
  const promosByProduct = await fetchActivePromosByProduct(top.map(p => p.id))

  const results = top.map(p => {
    const basePrice = role === 'b2b' && p.priceB2b ? Number(p.priceB2b) : Number(p.priceB2c)
    const staticOld = p.oldPrice ? Number(p.oldPrice) : null
    const { price, oldPrice, promoBadge } = applyBestPromo(
      promosByProduct.get(p.id) || [],
      basePrice,
      staticOld,
      role,
    )
    return {
      id: p.id,
      name: p.nameLat,
      slug: p.slug,
      sku: p.sku,
      brand: p.brand?.name,
      price,
      oldPrice,
      promoBadge,
      image: p.images[0]?.url || null,
      isProfessional: p.isProfessional,
    }
  })

  return successResponse(results)
})
