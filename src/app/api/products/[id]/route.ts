import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin, getCurrentUser } from '@/lib/auth-helpers'
import { getRouteParams } from '@/lib/route-utils'
import { updateProductSchema } from '@/lib/validations/product'
import { resolveBrandId, resolveCategoryId, resolveProductLineId } from '@/lib/taxonomy'

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

  // Professional products are only for B2B and admin — guests and B2C are blocked
  // even via direct URL.
  if (product.isProfessional && role !== 'b2b' && role !== 'admin') {
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

  // Helper: calculate discounted price for a given promo
  const calcDiscounted = (price: number, type: string, value: number) => {
    if (type === 'percentage') return Math.round(price * (1 - value / 100))
    if (type === 'fixed') return Math.max(0, price - value)
    if (type === 'price') return value
    return price
  }

  // Helper: pick the best promotion (lowest final price) for a given base price and role
  const pickBestPromo = (
    promos: Array<{ type: string; value: number; audience: string; badge?: string | null }>,
    price: number,
    userRole: string | undefined
  ) => {
    const eligible = promos.filter(pr => pr.audience === 'all' || pr.audience === userRole)
    if (eligible.length === 0) return null
    return eligible.reduce((best, pr) => {
      const dp = calcDiscounted(price, pr.type, pr.value)
      const bestDp = calcDiscounted(price, best.type, best.value)
      return dp < bestDp ? pr : best
    })
  }

  // Check active promotions for this product and all related products in one query
  const allProductIds = [product.id, ...related.map(r => r.id)]
  const promosByProduct = new Map<string, Array<{ type: string; value: number; audience: string; badge: string | null }>>()

  try {
    const promoRows = await prisma.$queryRaw<Array<{
      product_id: string; type: string; value: number; audience: string; badge: string | null
    }>>`
      SELECT pp.product_id, pr.type, pr.value, pr.audience, pr.badge
      FROM promotion_products pp
      JOIN promotions pr ON pr.id = pp.promotion_id
      WHERE pp.product_id = ANY(${allProductIds})
        AND pr.is_active = true
        AND (pr.start_date IS NULL OR pr.start_date::date <= CURRENT_DATE)
        AND (pr.end_date IS NULL OR pr.end_date::date >= CURRENT_DATE)
    `
    for (const row of promoRows) {
      const arr = promosByProduct.get(row.product_id) || []
      arr.push({ type: row.type, value: Number(row.value), audience: row.audience, badge: row.badge })
      promosByProduct.set(row.product_id, arr)
    }
  } catch (err) {
    console.error('[products/[id]] Failed to fetch promotions:', err)
  }

  // Apply best promotion for the main product
  let promoBadge: string | null = null
  const mainPromos = promosByProduct.get(product.id) || []

  // Format response — hide sensitive pricing from unauthorized users
  const isB2bOrAdmin = role === 'b2b' || role === 'admin'
  let basePrice = role === 'b2b' && product.priceB2b ? Number(product.priceB2b) : Number(product.priceB2c)
  let oldPrice = product.oldPrice ? Number(product.oldPrice) : null

  const bestPromo = pickBestPromo(mainPromos, basePrice, role)
  if (bestPromo) {
    const discountedPrice = calcDiscounted(basePrice, bestPromo.type, bestPromo.value)
    if (discountedPrice < basePrice) {
      oldPrice = basePrice
      basePrice = discountedPrice
      promoBadge = bestPromo.badge || null
    }
  }

  const formatted = {
    ...product,
    priceB2c: Number(product.priceB2c),
    priceB2b: isB2bOrAdmin && product.priceB2b ? Number(product.priceB2b) : null,
    oldPrice,
    costPrice: role === 'admin' && product.costPrice ? Number(product.costPrice) : null,
    price: basePrice,
    promoBadge,
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
    related: related.map(r => {
      let relPrice = role === 'b2b' && r.priceB2b ? Number(r.priceB2b) : Number(r.priceB2c)
      let relOldPrice = r.oldPrice ? Number(r.oldPrice) : null

      const relPromos = promosByProduct.get(r.id) || []
      const relBest = pickBestPromo(relPromos, relPrice, role)
      if (relBest) {
        const dp = calcDiscounted(relPrice, relBest.type, relBest.value)
        if (dp < relPrice) { relOldPrice = relPrice; relPrice = dp }
      }

      return {
        id: r.id,
        name: r.nameLat,
        slug: r.slug,
        brand: r.brand,
        price: relPrice,
        oldPrice: relOldPrice,
        image: r.images[0]?.url || null,
        isProfessional: r.isProfessional,
      }
    }),
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

  // Same find-or-create as POST: only resolve from name when an explicit id
  // wasn't passed, so admin edits that just rename a product don't accidentally
  // re-attach taxonomy. `undefined` leaves the column untouched.
  const brandId = body.brandId !== undefined
    ? body.brandId
    : body.brand !== undefined ? await resolveBrandId(body.brand) : undefined
  const productLineId = body.productLineId !== undefined
    ? body.productLineId
    : body.productLine !== undefined ? await resolveProductLineId(brandId ?? null, body.productLine) : undefined
  const categoryId = body.categoryId !== undefined
    ? body.categoryId
    : body.category !== undefined ? await resolveCategoryId(body.category, body.subCategory) : undefined

  const product = await prisma.product.update({
    where: { id },
    data: {
      nameLat: body.nameLat,
      nameCyr: body.nameCyr,
      brandId,
      productLineId,
      categoryId,
      description: body.description,
      benefits: body.benefits,
      ingredients: body.ingredients,
      declaration: body.declaration,
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

// DELETE /api/products/[id] — Hard delete when safe, soft delete when blocked
// by order history. Order rows reference Product without cascade so they pin
// the row in place — losing them would orphan the order's line items.
export const DELETE = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  const orderItemCount = await prisma.orderItem.count({ where: { productId: id } })

  if (orderItemCount > 0) {
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })
    revalidatePath('/')
    revalidatePath('/products')
    return successResponse({
      deleted: true,
      soft: true,
      message: 'Proizvod je deo postojećih porudžbina pa je deaktiviran umesto trajno obrisan.',
    })
  }

  // Cart and wishlist references aren't cascade-deleted in the schema; clear
  // them first so the FK constraint doesn't reject the hard delete. Reviews,
  // images, color, attributes, and promo links cascade automatically.
  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { productId: id } }),
    prisma.wishlist.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ])

  revalidatePath('/')
  revalidatePath('/products')

  return successResponse({ deleted: true })
})
