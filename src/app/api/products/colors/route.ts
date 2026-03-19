import { prisma } from '@/lib/db'
import { successResponse, withErrorHandler } from '@/lib/api-utils'

// GET /api/products/colors?brandLine=majirel&level=7&undertone=N
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const brandLineSlug = searchParams.get('brandLine')
  const level = searchParams.get('level')
  const undertone = searchParams.get('undertone')

  const where: Record<string, unknown> = {
    product: { isActive: true },
  }

  if (level) where.colorLevel = Number(level)
  if (undertone) where.undertoneCode = undertone

  // If brandLine specified, filter by product line
  if (brandLineSlug) {
    const productLine = await prisma.productLine.findUnique({
      where: { slug: brandLineSlug },
    })
    if (productLine) {
      where.product = { ...where.product as object, productLineId: productLine.id }
    }
  }

  const colors = await prisma.colorProduct.findMany({
    where,
    include: {
      product: {
        include: {
          brand: { select: { name: true, slug: true } },
          productLine: { select: { name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
    orderBy: [{ colorLevel: 'asc' }, { undertoneCode: 'asc' }],
  })

  // Group by level × undertone
  const grouped: Record<number, Record<string, unknown[]>> = {}
  for (const c of colors) {
    if (!grouped[c.colorLevel]) grouped[c.colorLevel] = {}
    if (!grouped[c.colorLevel][c.undertoneCode]) grouped[c.colorLevel][c.undertoneCode] = []
    grouped[c.colorLevel][c.undertoneCode].push({
      id: c.id,
      productId: c.product.id,
      name: c.product.nameLat,
      slug: c.product.slug,
      shadeCode: c.shadeCode,
      hexValue: c.hexValue,
      level: c.colorLevel,
      undertoneCode: c.undertoneCode,
      undertoneName: c.undertoneName,
      price: Number(c.product.priceB2c),
      brand: c.product.brand,
      productLine: c.product.productLine,
      image: c.product.images[0]?.url || null,
    })
  }

  // Also return available brand lines for tabs
  const brandLines = await prisma.productLine.findMany({
    where: {
      products: {
        some: {
          isActive: true,
          colorProduct: { isNot: null },
        },
      },
    },
    include: {
      brand: { select: { name: true } },
      _count: {
        select: {
          products: {
            where: { isActive: true, colorProduct: { isNot: null } },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return successResponse({
    colors: grouped,
    brandLines: brandLines.map(bl => ({
      slug: bl.slug,
      name: bl.name,
      brand: bl.brand.name,
      count: bl._count.products,
    })),
    total: colors.length,
  })
})
