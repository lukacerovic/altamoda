export const revalidate = 60

import { prisma } from '@/lib/db'
import HomePageClient from './HomePageClient'
import type { ProductData, ColorSiblingData } from './HomePageClient'

function formatProduct(p: {
  id: string; nameLat: string; slug: string; sku: string; priceB2c: unknown; priceB2b: unknown; oldPrice: unknown;
  stockQuantity: number; isNew: boolean; isFeatured: boolean; isProfessional: boolean;
  groupSlug: string | null;
  brand: { name: string } | null;
  images: { url: string }[];
}, avgRating: number, siblings?: ColorSiblingData[]): ProductData {
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
    groupSlug: p.groupSlug,
    colorSiblings: siblings && siblings.length > 1 ? siblings : undefined,
  }
}

export default async function HomePage() {
  const productInclude = {
    brand: { select: { name: true } },
    images: { where: { isPrimary: true }, take: 1 },
  }

  // "On sale" = static oldPrice OR a currently-active promotion linked to the product.
  // Audience limited to public-facing buckets so B2B-only promotions don't leak to the public homepage.
  const now = new Date()
  const saleAudiences = ['all', 'b2c'] as const

  // Fetch all product sets + hero settings + social links in parallel
  const [featured, bestsellers, newArrivals, saleProducts, heroSetting, heroCardsSetting, socialSettings] = await Promise.all([
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
      where: {
        isActive: true,
        OR: [
          { oldPrice: { not: null } },
          {
            promotionProducts: {
              some: {
                promotion: {
                  isActive: true,
                  audience: { in: [...saleAudiences] },
                  AND: [
                    { OR: [{ startDate: null }, { startDate: { lte: now } }] },
                    { OR: [{ endDate: null }, { endDate: { gte: now } }] },
                  ],
                },
              },
            },
          },
        ],
      },
      include: productInclude,
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.siteSetting.findUnique({ where: { key: 'heroImages' } }),
    prisma.siteSetting.findUnique({ where: { key: 'heroCards' } }),
    prisma.siteSetting.findMany({ where: { key: { in: ['instagram', 'facebook', 'tiktok'] } } }),
  ])

  const socialMap: Record<string, string> = {}
  for (const s of socialSettings) socialMap[s.key] = s.value

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

  // Fetch all color siblings in one batch for products belonging to a color group.
  const groupSlugs = [...new Set(allProducts.map(p => p.groupSlug).filter((g): g is string => !!g))]
  const siblingRows = groupSlugs.length > 0
    ? await prisma.product.findMany({
        where: { groupSlug: { in: groupSlugs }, isActive: true },
        select: {
          id: true, slug: true, nameLat: true, sku: true, priceB2c: true,
          colorCode: true, colorName: true, groupSlug: true, stockQuantity: true,
          brand: { select: { name: true } },
          images: { where: { isPrimary: true }, take: 1 },
          colorProduct: { select: { hexValue: true } },
        },
      })
    : []

  const siblingsByGroup = new Map<string, ColorSiblingData[]>()
  for (const s of siblingRows) {
    if (!s.groupSlug) continue
    const arr = siblingsByGroup.get(s.groupSlug) || []
    arr.push({
      id: s.id,
      slug: s.slug,
      name: s.nameLat,
      sku: s.sku,
      brand: s.brand?.name || '',
      price: Number(s.priceB2c),
      image: s.images[0]?.url || null,
      colorCode: s.colorCode,
      colorName: s.colorName,
      hex: s.colorProduct?.hexValue || null,
      stockQuantity: s.stockQuantity,
    })
    siblingsByGroup.set(s.groupSlug, arr)
  }

  const getSiblings = (groupSlug: string | null) => groupSlug ? siblingsByGroup.get(groupSlug) : undefined

  return (
    <HomePageClient
      featuredProducts={featured.map(p => formatProduct(p, getRating(p.id), getSiblings(p.groupSlug)))}
      bestsellers={bestsellers.map(p => formatProduct(p, getRating(p.id), getSiblings(p.groupSlug)))}
      newArrivals={newArrivals.map(p => formatProduct(p, getRating(p.id), getSiblings(p.groupSlug)))}
      saleProducts={saleProducts.map(p => formatProduct(p, getRating(p.id), getSiblings(p.groupSlug)))}
      heroImages={heroSetting?.value ? (() => { try { return JSON.parse(heroSetting.value); } catch { return []; } })() : []}
      heroCards={heroCardsSetting?.value ? (() => { try { return JSON.parse(heroCardsSetting.value); } catch { return []; } })() : []}
      socialLinks={{
        instagram: socialMap.instagram || '',
        facebook: socialMap.facebook || '',
        tiktok: socialMap.tiktok || '',
      }}
    />
  )
}
