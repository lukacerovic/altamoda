import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler, getPaginationParams } from '@/lib/api-utils'
import { requireAdmin, getCurrentUser } from '@/lib/auth-helpers'
import { slugify } from '@/lib/utils'
import { Prisma } from '@prisma/client'

// Serbian diacritics: build all character-level variants so cetkica matches četkica
function expandDiacritics(term: string): string[] {
  const charGroups: Record<string, string[]> = {
    s: ['s', 'š'], š: ['s', 'š'],
    c: ['c', 'č', 'ć'], č: ['c', 'č', 'ć'], ć: ['c', 'č', 'ć'],
    z: ['z', 'ž'], ž: ['z', 'ž'],
    d: ['d', 'đ'], đ: ['d', 'đ'],
  }
  // Generate variants by replacing one char group at a time
  // For efficiency, limit to first 8 variant positions max
  const results = new Set<string>([term])
  const lower = term.toLowerCase()

  // Find positions that have diacritic alternatives
  const positions: number[] = []
  for (let i = 0; i < lower.length; i++) {
    if (charGroups[lower[i]]) positions.push(i)
  }

  // Generate all combinations (limit to 2^8 = 256 max)
  const maxPositions = Math.min(positions.length, 8)
  const count = 1 << maxPositions
  for (let mask = 0; mask < count; mask++) {
    const chars = lower.split('')
    for (let b = 0; b < maxPositions; b++) {
      const pos = positions[b]
      const alts = charGroups[chars[pos]]
      if (alts) {
        chars[pos] = (mask >> b) & 1 ? alts[1] : alts[0]
      }
    }
    results.add(chars.join(''))
  }
  return Array.from(results)
}

// GET /api/products — List with filters, pagination, B2B/B2C visibility
export const GET = withErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = getPaginationParams(searchParams)

  const user = await getCurrentUser()
  const role = user?.role

  // Filter params
  const category = searchParams.get('category')
  const brandSlugs = searchParams.getAll('brand')
  const search = searchParams.get('search')?.slice(0, 255)
  const sort = searchParams.get('sort') || 'popular'
  const priceMin = searchParams.get('priceMin')
  const priceMax = searchParams.get('priceMax')
  const isNew = searchParams.get('isNew')
  const onSale = searchParams.get('onSale')
  const isFeatured = searchParams.get('isFeatured')
  const isBestseller = searchParams.get('isBestseller')
  // Guest tab filter: 'all' | 'b2c' | 'b2b'
  const visibility = searchParams.get('visibility') || 'all'

  // Color filters
  const colorLevel = searchParams.get('colorLevel')
  const colorUndertone = searchParams.get('colorUndertone')
  const hasColor = searchParams.get('hasColor')

  // Build where clause — admins can see inactive products too
  const where: Prisma.ProductWhereInput = {
    ...(role !== 'admin' ? { isActive: true } : {}),
  }

  // Visibility logic
  if (role === 'b2c') {
    // Logged-in B2C: hide professional products
    where.isProfessional = false
  } else if (role === 'b2b') {
    // Logged-in B2B: show all products (professional + retail)
  } else if (!role) {
    // Guest: use visibility tab
    if (visibility === 'b2c') {
      where.isProfessional = false
    } else if (visibility === 'b2b') {
      where.isProfessional = true
    }
    // 'all' shows everything
  }
  // Admin sees everything

  // Category filter (by slug) — single query for parent + children
  if (category) {
    const catWithChildren = await prisma.category.findMany({
      where: {
        OR: [{ slug: category }, { parent: { slug: category }, isActive: true }],
      },
      select: { id: true },
    })
    if (catWithChildren.length > 0) {
      where.categoryId = { in: catWithChildren.map(c => c.id) }
    }
  }

  // Brand filter (by slug, multi-select)
  if (brandSlugs.length > 0) {
    const brands = await prisma.brand.findMany({
      where: { slug: { in: brandSlugs } },
    })
    if (brands.length > 0) {
      where.brandId = { in: brands.map(b => b.id) }
    }
  }

  // Price range — filter by the price the user actually sees
  if (priceMin || priceMax) {
    const priceField = role === 'b2b' ? 'priceB2b' : 'priceB2c'
    const priceFilter: { gte?: number; lte?: number } = {}
    if (priceMin) priceFilter.gte = Number(priceMin)
    if (priceMax) priceFilter.lte = Number(priceMax)
    where[priceField] = priceFilter
  }

  // Gender filter
  const gender = searchParams.get('gender')
  if (gender) {
    where.gender = gender
  }

  // Boolean filters
  if (isNew === 'true') where.isNew = true
  if (onSale === 'true') where.oldPrice = { not: null }
  if (isFeatured === 'true') where.isFeatured = true
  if (isBestseller === 'true') where.isBestseller = true

  // Search (with Serbian diacritics support: sampon matches šampon)
  if (search) {
    const terms = expandDiacritics(search)
    where.OR = terms.flatMap(term => [
      { nameLat: { contains: term, mode: 'insensitive' as const } },
      { sku: { contains: term, mode: 'insensitive' as const } },
      { brand: { name: { contains: term, mode: 'insensitive' as const } } },
    ])
  }

  // Color filters
  if (hasColor === 'true') {
    where.colorProduct = { isNot: null }
  }
  if (colorLevel) {
    where.colorProduct = {
      ...((where.colorProduct as object) || {}),
      colorLevel: Number(colorLevel),
    }
  }
  if (colorUndertone) {
    where.colorProduct = {
      ...((where.colorProduct as object) || {}),
      undertoneCode: colorUndertone,
    }
  }

  // Dynamic attribute filters: attr_bez-sulfata=true
  const attrFilters: { slug: string; value: string }[] = []
  searchParams.forEach((value, key) => {
    if (key.startsWith('attr_')) {
      attrFilters.push({ slug: key.replace('attr_', ''), value })
    }
  })

  if (attrFilters.length > 0) {
    where.productAttributes = {
      some: {
        OR: attrFilters.map(f => ({
          attribute: { slug: f.slug },
          value: f.value,
        })),
      },
    }
  }

  // Sort — always show in-stock products first
  let sortOrderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
  if (sort === 'price_asc') sortOrderBy = { priceB2c: 'asc' }
  else if (sort === 'price_desc') sortOrderBy = { priceB2c: 'desc' }
  else if (sort === 'newest') sortOrderBy = { createdAt: 'desc' }
  else if (sort === 'name_asc') sortOrderBy = { nameLat: 'asc' }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [
    { stockQuantity: 'desc' },
    sortOrderBy,
  ]

  // For grouped products, find representatives and exclude duplicates
  // Uses 2 queries instead of 3: groupBy for count + single query for rep IDs + all IDs
  const groupedInFilter = await prisma.product.groupBy({
    by: ['groupSlug'],
    where: { ...where, groupSlug: { not: null } },
    _count: true,
  })
  const duplicateCount = groupedInFilter.reduce((sum, g) => sum + g._count - 1, 0)

  const excludeIds = new Set<string>()
  if (groupedInFilter.length > 0) {
    const groupSlugsInFilter = groupedInFilter.map(g => g.groupSlug).filter(Boolean) as string[]

    // Fetch reps (distinct per group) and all group members in parallel
    const [reps, allInGroups] = await Promise.all([
      prisma.product.findMany({
        where: { groupSlug: { in: groupSlugsInFilter }, isActive: true },
        select: { id: true, groupSlug: true },
        orderBy: [{ stockQuantity: 'desc' }, { nameLat: 'asc' }],
        distinct: ['groupSlug'],
      }),
      prisma.product.findMany({
        where: { groupSlug: { in: groupSlugsInFilter }, isActive: true },
        select: { id: true },
      }),
    ])
    const repIds = new Set(reps.map(r => r.id))
    for (const p of allInGroups) {
      if (!repIds.has(p.id)) excludeIds.add(p.id)
    }
  }

  // Add exclusion to where clause
  const finalWhere = excludeIds.size > 0
    ? { ...where, NOT: { id: { in: Array.from(excludeIds) } } }
    : where

  // Query
  const [products, totalRaw] = await Promise.all([
    prisma.product.findMany({
      where: finalWhere,
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, nameLat: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        colorProduct: true,
        _count: { select: { reviews: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])
  const total = totalRaw - duplicateCount

  // Calculate avg ratings + variant counts in parallel
  const productIds = products.map(p => p.id)
  const groupSlugs = [...new Set(products.map(p => p.groupSlug).filter(Boolean))] as string[]

  const [ratings, variantCounts] = await Promise.all([
    prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
    }),
    groupSlugs.length > 0
      ? prisma.product.groupBy({
          by: ['groupSlug'],
          where: { groupSlug: { in: groupSlugs }, isActive: true },
          _count: true,
        })
      : Promise.resolve([]),
  ])

  // Auto-delete expired promotions (fire-and-forget, don't block response)
  prisma.promotion.deleteMany({
    where: { endDate: { not: null, lt: new Date() } },
  }).catch(() => {})

  // Fetch active promotions for these products via raw SQL
  // Store all active promotions per product, pick the best matching one later
  const promosByProduct = new Map<string, Array<{ type: string; value: number; audience: string; badge: string | null }>>()
  try {
    if (productIds.length > 0) {
      const promoRows = await prisma.$queryRaw<Array<{
        product_id: string; type: string; value: number; audience: string; badge: string | null
      }>>`
        SELECT pp.product_id, pr.type, pr.value, pr.audience, pr.badge
        FROM promotion_products pp
        JOIN promotions pr ON pr.id = pp.promotion_id
        WHERE pp.product_id = ANY(${productIds})
          AND pr.is_active = true
          AND (pr.start_date IS NULL OR pr.start_date::date <= CURRENT_DATE)
          AND (pr.end_date IS NULL OR pr.end_date::date >= CURRENT_DATE)
      `
      for (const row of promoRows) {
        const arr = promosByProduct.get(row.product_id) || []
        arr.push({ type: row.type, value: Number(row.value), audience: row.audience, badge: row.badge })
        promosByProduct.set(row.product_id, arr)
      }
    }
  } catch (err) {
    console.error('[products] Failed to fetch promotions:', err)
  }
  const ratingMap = new Map(ratings.map(r => [r.productId, r._avg.rating || 0]))
  const variantCountMap = new Map(variantCounts.map(v => [v.groupSlug!, v._count]))

  // Format response — show appropriate price based on role
  const formatted = products.map(p => {
    // Strip color code from name for grouped products
    const name = p.groupSlug && p.colorCode
      ? p.nameLat.replace(p.colorCode, '').replace(/\/+/g, ' ').replace(/\s{2,}/g, ' ').trim()
      : p.nameLat

    let basePrice = role === 'b2b' && p.priceB2b ? Number(p.priceB2b) : Number(p.priceB2c)
    let oldPrice = p.oldPrice ? Number(p.oldPrice) : null

    // Helper: calculate discounted price for a promo
    const calcDisc = (price: number, type: string, value: number) => {
      if (type === 'percentage') return Math.round(price * (1 - value / 100))
      if (type === 'fixed') return Math.max(0, price - value)
      if (type === 'price') return value
      return price
    }

    // Apply best matching active promotion (lowest final price) for this user's role
    const promos = promosByProduct.get(p.id) || []
    const eligible = promos.filter(pr => pr.audience === 'all' || pr.audience === role)
    const promo = eligible.length > 0
      ? eligible.reduce((best, pr) => {
          const dp = calcDisc(basePrice, pr.type, pr.value)
          const bestDp = calcDisc(basePrice, best.type, best.value)
          return dp < bestDp ? pr : best
        })
      : null

    if (promo) {
      const discountedPrice = calcDisc(basePrice, promo.type, promo.value)
      if (discountedPrice < basePrice) {
        oldPrice = basePrice
        basePrice = discountedPrice
      }
    }

    return {
      id: p.id,
      sku: p.sku,
      name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      price: basePrice,
      priceB2c: Number(p.priceB2c),
      priceB2b: (role === 'b2b' || role === 'admin') && p.priceB2b ? Number(p.priceB2b) : null,
      oldPrice,
      image: p.images[0]?.url || null,
      isProfessional: p.isProfessional,
      isNew: p.isNew,
      isFeatured: p.isFeatured,
      isBestseller: p.isBestseller,
      stockQuantity: p.stockQuantity,
      ...(role === 'admin' ? { barcode: p.barcode, vatRate: p.vatRate, vatCode: p.vatCode, erpId: p.erpId } : {}),
      promoBadge: promo?.badge || null,
      rating: ratingMap.get(p.id) || 0,
      reviewCount: p._count.reviews,
      colorProduct: p.colorProduct,
      groupSlug: p.groupSlug,
      colorCode: p.colorCode,
      variantCount: p.groupSlug ? variantCountMap.get(p.groupSlug) || 0 : 0,
    }
  })

  return successResponse({
    products: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})

// POST /api/products — Create product (admin)
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()
  const body = await req.json()

  if (!body.nameLat || !body.priceB2c) {
    return errorResponse('Naziv i cena su obavezni', 400)
  }

  const slug = slugify(body.nameLat)
  const sku = body.sku || `PRD-${Date.now().toString(36).toUpperCase()}`

  const existingSku = await prisma.product.findUnique({ where: { sku } })
  if (existingSku) return errorResponse('Proizvod sa ovom šifrom već postoji', 409)

  const existingSlug = await prisma.product.findUnique({ where: { slug } })
  const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug

  const product = await prisma.product.create({
    data: {
      sku,
      nameLat: body.nameLat,
      nameCyr: body.nameCyr,
      slug: finalSlug,
      brandId: body.brandId || null,
      productLineId: body.productLineId || null,
      categoryId: body.categoryId || null,
      description: body.description,
      ingredients: body.ingredients,
      usageInstructions: body.usageInstructions,
      priceB2c: body.priceB2c,
      priceB2b: body.priceB2b,
      oldPrice: body.oldPrice,
      costPrice: body.costPrice,
      stockQuantity: body.stockQuantity || 0,
      lowStockThreshold: body.lowStockThreshold || 5,
      weightGrams: body.weightGrams,
      volumeMl: body.volumeMl,
      isProfessional: body.isProfessional || false,
      isNew: body.isNew || false,
      isFeatured: body.isFeatured || false,
      isBestseller: body.isBestseller || false,
      barcode: body.barcode,
      vatRate: body.vatRate ?? 20,
      vatCode: body.vatCode,
      erpId: body.erpId,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
    },
    include: {
      brand: true,
      category: true,
      images: true,
    },
  })

  // Create color product if provided with a valid level
  if (body.colorLevel && typeof body.colorLevel === 'number' && body.colorLevel >= 1 && body.colorLevel <= 10) {
    await prisma.colorProduct.create({
      data: {
        productId: product.id,
        colorLevel: body.colorLevel,
        undertoneCode: body.undertoneCode || 'N',
        undertoneName: body.undertoneName || 'Neutralni',
        hexValue: body.hexValue || '#000000',
        shadeCode: body.shadeCode || '',
      },
    })
  }

  // Create images if provided
  if (body.images?.length) {
    await prisma.productImage.createMany({
      data: body.images.map((img: { url: string; altText?: string; type?: string; isPrimary?: boolean }, i: number) => ({
        productId: product.id,
        url: img.url,
        altText: img.altText || product.nameLat,
        type: img.type || 'image',
        sortOrder: i,
        isPrimary: img.isPrimary || i === 0,
      })),
    })
  }

  // Invalidate cached pages
  revalidatePath('/')
  revalidatePath('/products')

  return successResponse(product, 201)
})
