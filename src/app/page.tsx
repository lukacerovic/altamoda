export const revalidate = 60

import { prisma } from '@/lib/db'
import HomePageClient from './HomePageClient'
import type { ProductData } from './HomePageClient'

function formatProduct(p: {
  id: string; nameLat: string; slug: string; sku: string; priceB2c: unknown; priceB2b: unknown; oldPrice: unknown;
  stockQuantity: number; isNew: boolean; isFeatured: boolean; isProfessional: boolean;
  brand: { name: string } | null;
  images: { url: string }[];
}, avgRating: number): ProductData {
  return {
    id: p.id,
    name: p.nameLat,
    slug: p.slug,
    brand: p.brand?.name || '',
    price: Number(p.priceB2c),
    oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    rating: avgRating,
    image: p.images[0]?.url || null,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    isProfessional: p.isProfessional,
    stockQuantity: p.stockQuantity,
    sku: p.sku,
  }
}

export default async function HomePage() {
  const productInclude = {
    brand: { select: { name: true } },
    images: { where: { isPrimary: true }, take: 1 },
  }

  // Fetch all product sets + hero image setting in parallel
  const [featured, bestsellers, newArrivals, saleProducts, heroSetting] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productInclude,
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      where: { isActive: true, isBestseller: true },
      include: productInclude,
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      where: { isActive: true, isNew: true },
      include: productInclude,
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      where: { isActive: true, oldPrice: { not: null } },
      include: productInclude,
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.siteSetting.findUnique({ where: { key: 'heroImages' } }),
  ])

  // Get all product IDs for rating lookup
  const allProducts = [...featured, ...bestsellers, ...newArrivals, ...saleProducts]
  const uniqueIds = [...new Set(allProducts.map(p => p.id))]

  const ratings = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: uniqueIds } },
    _avg: { rating: true },
  })
  const ratingMap = new Map(ratings.map(r => [r.productId, r._avg.rating || 0]))

  const getRating = (id: string) => ratingMap.get(id) || 0

  return (
    <HomePageClient
      featuredProducts={featured.map(p => formatProduct(p, getRating(p.id)))}
      bestsellers={bestsellers.map(p => formatProduct(p, getRating(p.id)))}
      newArrivals={newArrivals.map(p => formatProduct(p, getRating(p.id)))}
      saleProducts={saleProducts.map(p => formatProduct(p, getRating(p.id)))}
      heroImages={heroSetting?.value ? (() => { try { return JSON.parse(heroSetting.value); } catch { return []; } })() : []}
    />
  )
}
