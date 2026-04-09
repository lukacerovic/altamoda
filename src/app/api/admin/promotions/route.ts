import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

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
  return mapPromotion(promo)
}

// Helper: map a Prisma promotion to API shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPromotion(p: any) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    value: Number(p.value),
    targetType: p.targetType,
    targetId: p.targetId,
    audience: p.audience,
    badge: p.badge,
    startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : null,
    endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : null,
    isActive: p.isActive,
    createdAt: new Date(p.createdAt).toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: (p.products || []).map((pp: any) => ({
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

// GET /api/admin/promotions
export const GET = withErrorHandler(async () => {
  await requireAdmin()

  // Auto-delete expired promotions (endDate has passed)
  await prisma.promotion.deleteMany({
    where: {
      endDate: { not: null, lt: new Date() },
    },
  })

  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: 'desc' },
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

  return successResponse(promotions.map(mapPromotion))
})

// POST /api/admin/promotions
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const body = await req.json()

  if (!body.name || !body.type || body.value === undefined) {
    return errorResponse('Nedostaju obavezna polja', 400)
  }

  const value = Number(body.value)
  const valError = validateValue(body.type, value)
  if (valError) return errorResponse(valError, 400)

  const promo = await prisma.promotion.create({
    data: {
      name: body.name,
      type: body.type,
      value,
      targetType: body.targetType || 'product',
      targetId: body.targetId || null,
      audience: body.audience || 'all',
      badge: body.badge || null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      isActive: true,
      products: body.productIds?.length
        ? {
            createMany: {
              data: body.productIds.map((pid: string) => ({ productId: pid })),
              skipDuplicates: true,
            },
          }
        : undefined,
    },
  })

  const result = await formatPromotion(promo.id)
  return successResponse(result, 201)
})
