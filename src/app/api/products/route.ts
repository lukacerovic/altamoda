import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler, getPaginationParams } from '@/lib/api-utils'
import { requireAdmin, getCurrentUser } from '@/lib/auth-helpers'
import { slugify } from '@/lib/utils'
import { Prisma } from '@prisma/client'

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

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    isActive: true,
  }

  // Visibility logic
  if (role === 'b2c') {
    // Logged-in B2C: hide professional products
    where.isProfessional = false
  } else if (role === 'b2b') {
    // Logged-in B2B: show only professional products
    where.isProfessional = true
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

  // Category filter (by slug)
  if (category) {
    const cat = await prisma.category.findUnique({ where: { slug: category } })
    if (cat) {
      // Include products from this category and all children
      const childCats = await prisma.category.findMany({
        where: { parentId: cat.id, isActive: true },
      })
      const catIds = [cat.id, ...childCats.map(c => c.id)]
      where.categoryId = { in: catIds }
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

  // Boolean filters
  if (isNew === 'true') where.isNew = true
  if (onSale === 'true') where.oldPrice = { not: null }
  if (isFeatured === 'true') where.isFeatured = true
  if (isBestseller === 'true') where.isBestseller = true

  // Search
  if (search) {
    where.OR = [
      { nameLat: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { brand: { name: { contains: search, mode: 'insensitive' } } },
    ]
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

  // Sort
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
  if (sort === 'price_asc') orderBy = { priceB2c: 'asc' }
  else if (sort === 'price_desc') orderBy = { priceB2c: 'desc' }
  else if (sort === 'newest') orderBy = { createdAt: 'desc' }
  else if (sort === 'name_asc') orderBy = { nameLat: 'asc' }

  // Query
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
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

  // Calculate avg ratings
  const productIds = products.map(p => p.id)
  const ratings = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds } },
    _avg: { rating: true },
  })
  const ratingMap = new Map(ratings.map(r => [r.productId, r._avg.rating || 0]))

  // Format response — show appropriate price based on role
  const formatted = products.map(p => ({
    id: p.id,
    sku: p.sku,
    name: p.nameLat,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    price: role === 'b2b' && p.priceB2b ? Number(p.priceB2b) : Number(p.priceB2c),
    priceB2c: Number(p.priceB2c),
    priceB2b: p.priceB2b ? Number(p.priceB2b) : null,
    oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    image: p.images[0]?.url || null,
    isProfessional: p.isProfessional,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    isBestseller: p.isBestseller,
    stockQuantity: p.stockQuantity,
    rating: ratingMap.get(p.id) || 0,
    reviewCount: p._count.reviews,
    colorProduct: p.colorProduct,
  }))

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

  return successResponse(product, 201)
})
