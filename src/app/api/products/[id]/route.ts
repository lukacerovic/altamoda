import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin, getCurrentUser } from '@/lib/auth-helpers'
import { getRouteParams } from '@/lib/route-utils'
import { updateProductSchema } from '@/lib/validations/product'

// GET /api/products/[id] — Full product detail
export const GET = withErrorHandler(async (_req: Request, context: unknown) => {
  const { id } = await getRouteParams<{ id: string }>(context)

  const user = await getCurrentUser()
  const role = user?.role

  // Find by id or slug
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      isActive: true,
    },
    include: {
      brand: true,
      productLine: true,
      category: { include: { parent: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      colorProduct: true,
      productAttributes: {
        include: { attribute: true },
      },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  })

  if (!product) return errorResponse('Proizvod nije pronađen', 404)

  // B2C visibility check
  if (role === 'b2c' && product.isProfessional) {
    return errorResponse('Proizvod nije dostupan', 403)
  }

  // Average rating
  const avgRating = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
  })

  // Related products (same category or same product line)
  const relatedWhere = {
    isActive: true,
    id: { not: product.id },
    OR: [
      ...(product.categoryId ? [{ categoryId: product.categoryId }] : []),
      ...(product.productLineId ? [{ productLineId: product.productLineId }] : []),
    ],
    // Respect B2C visibility
    ...(role === 'b2c' ? { isProfessional: false } : {}),
  }

  const relatedFallback = {
    isActive: true,
    id: { not: product.id },
    ...(role === 'b2c' ? { isProfessional: false } : {}),
  }

  const related = await prisma.product.findMany({
    where: relatedWhere.OR.length > 0 ? relatedWhere : relatedFallback,
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 8,
  })

  // Fetch color siblings if product is part of a group
  const colorSiblings = product.groupSlug
    ? await prisma.product.findMany({
        where: { groupSlug: product.groupSlug, isActive: true },
        select: {
          id: true,
          slug: true,
          nameLat: true,
          colorCode: true,
          colorName: true,
          stockQuantity: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { colorCode: 'asc' },
      })
    : []

  // Format response — hide sensitive pricing from unauthorized users
  const isB2bOrAdmin = role === 'b2b' || role === 'admin'
  const formatted = {
    ...product,
    priceB2c: Number(product.priceB2c),
    priceB2b: isB2bOrAdmin && product.priceB2b ? Number(product.priceB2b) : null,
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    costPrice: role === 'admin' && product.costPrice ? Number(product.costPrice) : null,
    price: role === 'b2b' && product.priceB2b ? Number(product.priceB2b) : Number(product.priceB2c),
    rating: avgRating._avg.rating || 0,
    reviewCount: product._count.reviews,
    colorSiblings: colorSiblings.map(s => ({
      id: s.id,
      slug: s.slug,
      name: s.nameLat,
      colorCode: s.colorCode,
      colorName: s.colorName,
      image: s.images[0]?.url || null,
      inStock: s.stockQuantity > 0,
      isActive: s.id === product.id,
    })),
    related: related.map(r => ({
      id: r.id,
      name: r.nameLat,
      slug: r.slug,
      brand: r.brand,
      price: role === 'b2b' && r.priceB2b ? Number(r.priceB2b) : Number(r.priceB2c),
      oldPrice: r.oldPrice ? Number(r.oldPrice) : null,
      image: r.images[0]?.url || null,
      isProfessional: r.isProfessional,
    })),
  }

  // Strip ERP/internal fields for non-admin users
  if (role !== 'admin') {
    delete (formatted as Record<string, unknown>).erpId
    delete (formatted as Record<string, unknown>).barcode
    delete (formatted as Record<string, unknown>).vatRate
    delete (formatted as Record<string, unknown>).vatCode
  }

  return successResponse(formatted)
})

// PUT /api/products/[id] — Update product (admin)
export const PUT = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  const raw = await req.json()
  const body = updateProductSchema.parse(raw)

  const product = await prisma.product.update({
    where: { id },
    data: {
      nameLat: body.nameLat,
      nameCyr: body.nameCyr,
      brandId: body.brandId,
      productLineId: body.productLineId,
      categoryId: body.categoryId,
      description: body.description,
      ingredients: body.ingredients,
      usageInstructions: body.usageInstructions,
      priceB2c: body.priceB2c,
      priceB2b: body.priceB2b,
      oldPrice: body.oldPrice,
      costPrice: body.costPrice,
      stockQuantity: body.stockQuantity,
      lowStockThreshold: body.lowStockThreshold,
      weightGrams: body.weightGrams,
      volumeMl: body.volumeMl,
      isProfessional: body.isProfessional,
      isNew: body.isNew,
      isFeatured: body.isFeatured,
      isBestseller: body.isBestseller,
      isActive: body.isActive,
      barcode: body.barcode,
      vatRate: body.vatRate,
      vatCode: body.vatCode,
      erpId: body.erpId,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
    },
    include: { brand: true, category: true, images: true },
  })

  // Update color product — only if colorLevel is a valid number
  if (body.colorLevel && typeof body.colorLevel === 'number' && body.colorLevel >= 1 && body.colorLevel <= 10) {
    await prisma.colorProduct.upsert({
      where: { productId: id },
      update: {
        colorLevel: body.colorLevel,
        undertoneCode: body.undertoneCode || 'N',
        undertoneName: body.undertoneName || 'Neutralni',
        hexValue: body.hexValue || '#000000',
        shadeCode: body.shadeCode || '',
      },
      create: {
        productId: id,
        colorLevel: body.colorLevel,
        undertoneCode: body.undertoneCode || 'N',
        undertoneName: body.undertoneName || 'Neutralni',
        hexValue: body.hexValue || '#000000',
        shadeCode: body.shadeCode || '',
      },
    })
  } else if (body.removeColor === true) {
    // Allow explicit removal of color data
    await prisma.colorProduct.deleteMany({ where: { productId: id } })
  }

  // Invalidate cached pages that display products
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath(`/products/${product.slug || id}`)

  return successResponse(product)
})

// DELETE /api/products/[id] — Soft delete (admin)
export const DELETE = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  })

  // Invalidate cached pages
  revalidatePath('/')
  revalidatePath('/products')

  return successResponse({ deleted: true })
})
