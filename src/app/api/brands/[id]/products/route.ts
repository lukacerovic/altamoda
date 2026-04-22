import { prisma } from '@/lib/db'
import { getRouteParams } from '@/lib/route-utils'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

/**
 * GET /api/brands/[id]/products
 * List products currently assigned to this brand.
 * Optional query: `?search=term&limit=50`
 */
export const GET = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  const brand = await prisma.brand.findUnique({ where: { id } })
  if (!brand) return errorResponse('Brend nije pronađen', 404)

  const url = new URL(req.url)
  const search = url.searchParams.get('search')?.trim() || ''
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit')) || 100))

  const products = await prisma.product.findMany({
    where: {
      brandId: id,
      ...(search
        ? {
            OR: [
              { nameLat: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      nameLat: true,
      sku: true,
      priceB2c: true,
      isActive: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
    },
    orderBy: { nameLat: 'asc' },
    take: limit,
  })

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.nameLat,
    sku: p.sku,
    price: Number(p.priceB2c),
    isActive: p.isActive,
    image: p.images?.[0]?.url ?? null,
  }))

  return successResponse(mapped)
})

/**
 * POST /api/brands/[id]/products
 * Attach products to this brand (bulk).
 * Body: { productIds: string[] }
 * Any product already belonging to another brand will be re-assigned.
 */
export const POST = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)
  const body = await req.json()

  const brand = await prisma.brand.findUnique({ where: { id } })
  if (!brand) return errorResponse('Brend nije pronađen', 404)

  const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : []
  if (productIds.length === 0) {
    return errorResponse('Nijedan proizvod nije prosleđen', 400)
  }
  if (productIds.length > 500) {
    return errorResponse('Maksimum 500 proizvoda po zahtevu', 400)
  }

  // Clear productLineId when reassigning to a different brand (lines are brand-scoped)
  const attached = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data: { brandId: id, productLineId: null },
  })

  return successResponse({ attached: attached.count })
})

/**
 * DELETE /api/brands/[id]/products
 * Detach products from this brand (bulk).
 * Body: { productIds: string[] }
 * Sets brandId = null on all listed products that currently belong to this brand.
 */
export const DELETE = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)
  const body = await req.json()

  const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : []
  if (productIds.length === 0) {
    return errorResponse('Nijedan proizvod nije prosleđen', 400)
  }

  const detached = await prisma.product.updateMany({
    where: { id: { in: productIds }, brandId: id },
    data: { brandId: null, productLineId: null },
  })

  return successResponse({ detached: detached.count })
})
