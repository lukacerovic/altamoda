export const revalidate = 120

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getProductBySlugOrId } from '@/lib/cached-queries'
import ProductDetailClient from './ProductDetailClient'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProductBySlugOrId(id)

  if (!product) return { title: 'Proizvod nije pronađen | Alta Moda' }

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0]
  return {
    title: `${product.nameLat} | ${product.brand?.name || 'Alta Moda'}`,
    description: product.seoDescription || product.description?.slice(0, 160) || `Kupite ${product.nameLat} po najboljoj ceni.`,
    openGraph: {
      title: product.seoTitle || product.nameLat,
      description: product.description?.slice(0, 200) || '',
      images: primaryImage?.url ? [primaryImage.url] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params

  // Uses React cache() — deduplicates with generateMetadata call above
  const product = await getProductBySlugOrId(id)

  if (!product) notFound()

  // Run all independent queries in parallel (no auth() call — page is fully cacheable)
  const relatedWhere = {
    isActive: true,
    id: { not: product.id },
    OR: [
      ...(product.categoryId ? [{ categoryId: product.categoryId }] : []),
      ...(product.productLineId ? [{ productLineId: product.productLineId }] : []),
    ],
  }

  const [avgRating, relatedProducts, colorSiblings] = await Promise.all([
    prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
    }),
    prisma.product.findMany({
      where: relatedWhere.OR.length > 0 ? relatedWhere : { isActive: true, id: { not: product.id } },
      include: {
        brand: { select: { name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      take: 8,
    }),
    product.groupSlug
      ? prisma.product.findMany({
          where: { groupSlug: product.groupSlug, isActive: true },
          select: {
            id: true, slug: true, nameLat: true, colorCode: true, colorName: true,
            stockQuantity: true,
            images: { orderBy: { sortOrder: 'asc' } },
          },
          orderBy: { colorCode: 'asc' },
        })
      : Promise.resolve([]),
  ])

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
    benefits: product.benefits,
    ingredients: product.ingredients,
    declaration: product.declaration,
    usageInstructions: product.usageInstructions,
    warnings: product.warnings,
    shelfLife: product.shelfLife,
    importerInfo: product.importerInfo,
    priceB2c: Number(product.priceB2c),
    priceB2b: product.priceB2b ? Number(product.priceB2b) : null,
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    price: Number(product.priceB2c),
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
    price: Number(r.priceB2c),
    oldPrice: r.oldPrice ? Number(r.oldPrice) : null,
    image: r.images[0]?.url || null,
    isProfessional: r.isProfessional,
  }))

  const siblings = colorSiblings.map(s => ({
    id: s.id,
    slug: s.slug,
    name: s.nameLat,
    colorCode: s.colorCode,
    colorName: s.colorName,
    images: s.images.map(img => ({ url: img.url, altText: img.altText })),
    inStock: s.stockQuantity > 0,
    isActive: s.id === product.id,
  }))

  // Wishlist/review status + user role are resolved client-side via useSession()
  return <ProductDetailClient product={serialized} related={related} colorSiblings={siblings} userRole={null} initialLiked={false} userExistingRating={null} />
}
