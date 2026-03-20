import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler, getPaginationParams } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// GET /api/admin/colors - List all color products with matrix data
export const GET = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const { searchParams } = new URL(req.url)
  const brandLineSlug = searchParams.get('brandLine')
  const level = searchParams.get('level')
  const undertone = searchParams.get('undertone')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = {}

  if (level) where.colorLevel = Number(level)
  if (undertone) where.undertoneCode = undertone

  const productWhere: Record<string, unknown> = {}
  if (brandLineSlug) {
    const pl = await prisma.productLine.findUnique({ where: { slug: brandLineSlug } })
    if (pl) productWhere.productLineId = pl.id
  }
  if (search) {
    productWhere.OR = [
      { nameLat: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (Object.keys(productWhere).length > 0) {
    where.product = productWhere
  }

  const colors = await prisma.colorProduct.findMany({
    where,
    include: {
      product: {
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          productLine: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, nameLat: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
    orderBy: [{ colorLevel: 'asc' }, { undertoneCode: 'asc' }],
  })

  // Build matrix data: level -> undertone -> colors[]
  const matrix: Record<number, Record<string, unknown[]>> = {}
  const allUndertones = new Set<string>()
  const allLevels = new Set<number>()

  for (const c of colors) {
    allLevels.add(c.colorLevel)
    allUndertones.add(c.undertoneCode)
    if (!matrix[c.colorLevel]) matrix[c.colorLevel] = {}
    if (!matrix[c.colorLevel][c.undertoneCode]) matrix[c.colorLevel][c.undertoneCode] = []
    matrix[c.colorLevel][c.undertoneCode].push({
      id: c.id,
      productId: c.product.id,
      name: c.product.nameLat,
      sku: c.product.sku,
      slug: c.product.slug,
      shadeCode: c.shadeCode,
      hexValue: c.hexValue,
      level: c.colorLevel,
      undertoneCode: c.undertoneCode,
      undertoneName: c.undertoneName,
      priceB2c: Number(c.product.priceB2c),
      priceB2b: c.product.priceB2b ? Number(c.product.priceB2b) : null,
      stock: c.product.stockQuantity,
      isActive: c.product.isActive,
      brand: c.product.brand,
      productLine: c.product.productLine,
      category: c.product.category,
      image: c.product.images[0]?.url || null,
    })
  }

  // Get brand lines that have color products
  const brandLines = await prisma.productLine.findMany({
    where: {
      products: {
        some: { colorProduct: { isNot: null } },
      },
    },
    include: {
      brand: { select: { name: true } },
      _count: {
        select: {
          products: { where: { colorProduct: { isNot: null } } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return successResponse({
    matrix,
    levels: Array.from(allLevels).sort((a, b) => a - b),
    undertones: Array.from(allUndertones).sort(),
    brandLines: brandLines.map(bl => ({
      id: bl.id,
      slug: bl.slug,
      name: bl.name,
      brand: bl.brand.name,
      count: bl._count.products,
    })),
    total: colors.length,
  })
})

// POST /api/admin/colors - Create a color product
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const body = await req.json()

  const {
    productId, colorLevel, undertoneCode, undertoneName, hexValue, shadeCode,
  } = body

  if (!productId || !colorLevel || !undertoneCode || !undertoneName || !hexValue || !shadeCode) {
    return errorResponse('Sva polja su obavezna', 400)
  }

  // Check product exists
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return errorResponse('Proizvod nije pronađen', 404)

  // Check if product already has color data
  const existing = await prisma.colorProduct.findUnique({ where: { productId } })
  if (existing) return errorResponse('Ovaj proizvod već ima podatke o boji', 400)

  const color = await prisma.colorProduct.create({
    data: {
      productId,
      colorLevel: Number(colorLevel),
      undertoneCode,
      undertoneName,
      hexValue,
      shadeCode,
    },
    include: {
      product: {
        include: {
          brand: { select: { name: true, slug: true } },
          productLine: { select: { name: true, slug: true } },
        },
      },
    },
  })

  return successResponse(color, 201)
})
