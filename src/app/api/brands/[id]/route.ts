import { prisma } from '@/lib/db'
import { getRouteParams } from '@/lib/route-utils'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { slugify } from '@/lib/utils'

// GET /api/brands/[id] — Get single brand with content
export const GET = withErrorHandler(async (_req: Request, context: unknown) => {
  const { id } = await getRouteParams<{ id: string }>(context)

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      productLines: { orderBy: { name: 'asc' } },
      _count: { select: { products: true } },
    },
  })

  if (!brand) return errorResponse('Brend nije pronađen', 404)

  return successResponse(brand)
})

// PUT /api/brands/[id] — Update brand (admin)
export const PUT = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)
  const body = await req.json()

  const existing = await prisma.brand.findUnique({ where: { id } })
  if (!existing) return errorResponse('Brend nije pronađen', 404)

  const updateData: Record<string, unknown> = {}
  if ('name' in body) {
    updateData.name = body.name
    if (body.name !== existing.name) {
      updateData.slug = slugify(body.name)
    }
  }
  if ('logoUrl' in body) updateData.logoUrl = body.logoUrl
  if ('description' in body) updateData.description = body.description
  if ('content' in body) updateData.content = body.content

  const brand = await prisma.brand.update({
    where: { id },
    data: updateData,
  })

  return successResponse(brand)
})

// DELETE /api/brands/[id] — Delete brand (admin)
// Detaches all products (sets brandId = null) and removes product lines.
// Products are NOT deleted — they remain in the catalogue without a brand.
export const DELETE = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  const existing = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true, productLines: true } } },
  })
  if (!existing) return errorResponse('Brend nije pronađen', 404)

  // Transaction: detach products → delete product lines → delete brand
  const result = await prisma.$transaction(async (tx) => {
    // Detach all products (brandId is nullable in schema)
    const detached = await tx.product.updateMany({
      where: { brandId: id },
      data: { brandId: null, productLineId: null },
    })

    // Remove product lines belonging to this brand
    const linesDeleted = await tx.productLine.deleteMany({
      where: { brandId: id },
    })

    await tx.brand.delete({ where: { id } })

    return { detachedProducts: detached.count, deletedLines: linesDeleted.count }
  })

  return successResponse({
    message: `Brend "${existing.name}" je obrisan. ${result.detachedProducts} proizvoda je ostalo bez brenda.`,
    ...result,
  })
})
