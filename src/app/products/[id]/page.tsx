import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import ProductDetailClient from './ProductDetailClient'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }], isActive: true },
    include: { brand: true, images: { where: { isPrimary: true }, take: 1 } },
  })

  if (!product) return { title: 'Proizvod nije pronađen | Alta Moda' }

  return {
    title: `${product.nameLat} | ${product.brand?.name || 'Alta Moda'}`,
    description: product.seoDescription || product.description?.slice(0, 160) || `Kupite ${product.nameLat} po najboljoj ceni.`,
    openGraph: {
      title: product.seoTitle || product.nameLat,
      description: product.description?.slice(0, 200) || '',
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role || null

  const product = await prisma.product.findFirst({
    where: { OR: [{ id }, { slug: id }], isActive: true },
    include: {
      brand: { select: { name: true, slug: true } },
      productLine: { select: { name: true, slug: true } },
      category: {
        select: { nameLat: true, slug: true, parent: { select: { nameLat: true, slug: true } } },
      },
      images: { orderBy: { sortOrder: 'asc' } },
      colorProduct: true,
      productAttributes: { include: { attribute: true } },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { reviews: true } },
    },
  })

  if (!product) notFound()

  // B2C visibility check
  if (role === 'b2c' && product.isProfessional) notFound()

  // Avg rating
  const avgRating = await prisma.review.aggregate({
    where: { productId: product.id },
    _avg: { rating: true },
  })

  // Related products
  const relatedWhere = {
    isActive: true,
    id: { not: product.id },
    OR: [
      ...(product.categoryId ? [{ categoryId: product.categoryId }] : []),
      ...(product.productLineId ? [{ productLineId: product.productLineId }] : []),
    ],
    ...(role === 'b2c' ? { isProfessional: false } : {}),
  }

  const relatedProducts = await prisma.product.findMany({
    where: relatedWhere.OR.length > 0 ? relatedWhere : { isActive: true, id: { not: product.id } },
    include: {
      brand: { select: { name: true, slug: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 8,
  })

  const price = role === 'b2b' && product.priceB2b ? Number(product.priceB2b) : Number(product.priceB2c)

  const serialized = {
    id: product.id,
    sku: product.sku,
    nameLat: product.nameLat,
    slug: product.slug,
    brand: product.brand,
    productLine: product.productLine,
    category: product.category,
    description: product.description,
    purpose: product.purpose,
    ingredients: product.ingredients,
    usageInstructions: product.usageInstructions,
    warnings: product.warnings,
    shelfLife: product.shelfLife,
    importerInfo: product.importerInfo,
    priceB2c: Number(product.priceB2c),
    priceB2b: product.priceB2b ? Number(product.priceB2b) : null,
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    price,
    stockQuantity: product.stockQuantity,
    isProfessional: product.isProfessional,
    isNew: product.isNew,
    images: product.images.map(img => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      type: img.type,
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    })),
    colorProduct: product.colorProduct
      ? {
          colorLevel: product.colorProduct.colorLevel,
          undertoneCode: product.colorProduct.undertoneCode,
          undertoneName: product.colorProduct.undertoneName,
          hexValue: product.colorProduct.hexValue,
          shadeCode: product.colorProduct.shadeCode,
        }
      : null,
    reviews: product.reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
    })),
    rating: avgRating._avg.rating || 0,
    reviewCount: product._count.reviews,
  }

  const related = relatedProducts.map(r => ({
    id: r.id,
    name: r.nameLat,
    slug: r.slug,
    brand: r.brand,
    price: role === 'b2b' && r.priceB2b ? Number(r.priceB2b) : Number(r.priceB2c),
    oldPrice: r.oldPrice ? Number(r.oldPrice) : null,
    image: r.images[0]?.url || null,
    isProfessional: r.isProfessional,
  }))

  // Check if user has this product in wishlist + already reviewed
  let isInWishlist = false
  let userExistingRating: number | null = null
  if (session?.user?.id) {
    const [wishlistEntry, existingReview] = await Promise.all([
      prisma.wishlist.findUnique({
        where: { userId_productId: { userId: session.user.id as string, productId: product.id } },
      }),
      prisma.review.findUnique({
        where: { productId_userId: { productId: product.id, userId: session.user.id as string } },
      }),
    ])
    isInWishlist = !!wishlistEntry
    userExistingRating = existingReview?.rating ?? null
  }

  return <ProductDetailClient product={serialized} related={related} userRole={role} initialLiked={isInWishlist} userExistingRating={userExistingRating} />
}
