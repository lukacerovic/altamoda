import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { getRouteParams } from '@/lib/route-utils'

// Helper: format a promotion with its products for the API response
async function formatPromotion(promoId: string) {
  const promo = await prisma.promotion.findUnique({
    where: { id: promoId },
    include: {
      products: {
        include: {
          product: {
            include: {
              brand: { select: { name: true } },
              category: { select: { nameLat: true } },
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  })
  if (!promo) return null

  return {
    id: promo.id,
    name: promo.name,
    type: promo.type,
    value: Number(promo.value),
    targetType: promo.targetType,
    targetId: promo.targetId,
    audience: promo.audience,
    badge: promo.badge,
    startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : null,
    endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : null,
    isActive: promo.isActive,
    createdAt: new Date(promo.createdAt).toISOString(),
    products: promo.products.map(pp => ({
      id: pp.product.id,
      name: pp.product.nameLat,
      sku: pp.product.sku,
      brand: pp.product.brand?.name || '',
      category: pp.product.category?.nameLat || '',
      originalPrice: Number(pp.product.priceB2c),
      image: pp.product.images?.[0]?.url || '',
    })),
  }
}

// Validate promotion value based on type
function validateValue(type: string, value: number): string | null {
  if (!Number.isFinite(value)) return 'Vrednost mora biti validan broj'
  if (type === 'percentage') {
    if (value < 1 || value > 99) return 'Procenat mora biti između 1 i 99'
  } else if (type === 'fixed') {
    if (value <= 0) return 'Fiksni popust mora biti veći od 0'
  } else if (type === 'price') {
    if (value <= 0) return 'Cena mora biti veća od 0'
  }
  return null
}

// PUT /api/admin/promotions/[id]
export const PUT = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)
  const body = await req.json()

  const existing = await prisma.promotion.findUnique({ where: { id } })
  if (!existing) return errorResponse('Akcija nije pronađena', 404)

  // Validate value if provided
  if (body.value !== undefined) {
    const type = body.type || existing.type
    const valError = validateValue(type, Number(body.value))
    if (valError) return errorResponse(valError, 400)
  }

  await prisma.promotion.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.value !== undefined && { value: Number(body.value) }),
      ...(body.targetType !== undefined && { targetType: body.targetType }),
      ...(body.targetId !== undefined && { targetId: body.targetId }),
      ...(body.audience !== undefined && { audience: body.audience }),
      ...(body.badge !== undefined && { badge: body.badge }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
      ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
    },
  })

  // Update product associations if provided
  if (body.productIds !== undefined) {
    await prisma.promotionProduct.deleteMany({ where: { promotionId: id } })
    if (body.productIds.length > 0) {
      await prisma.promotionProduct.createMany({
        data: body.productIds.map((pid: string) => ({ promotionId: id, productId: pid })),
        skipDuplicates: true,
      })
    }
  }

  const result = await formatPromotion(id)
  return successResponse(result)
})

// DELETE /api/admin/promotions/[id]
export const DELETE = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  const existing = await prisma.promotion.findUnique({ where: { id } })
  if (!existing) return errorResponse('Akcija nije pronađena', 404)

  // Cascade delete handles promotion_products via schema onDelete: Cascade
  await prisma.promotion.delete({ where: { id } })

  return successResponse({ message: 'Akcija je obrisana' })
})

// PATCH /api/admin/promotions/[id] — Toggle active
export const PATCH = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  const existing = await prisma.promotion.findUnique({ where: { id } })
  if (!existing) return errorResponse('Akcija nije pronađena', 404)

  const updated = await prisma.promotion.update({
    where: { id },
    data: { isActive: !existing.isActive },
  })

  return successResponse({ id, isActive: updated.isActive })
})
