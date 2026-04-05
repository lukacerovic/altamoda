import { cache } from 'react'
import { prisma } from '@/lib/db'

/**
 * Cached product detail fetch — deduplicates across generateMetadata + page component.
 */
export const getProductBySlugOrId = cache(async (id: string) => {
  return prisma.product.findFirst({
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
})

/**
 * Cached active brands — shared across product listing, header, etc.
 */
export const getActiveBrands = cache(async () => {
  return prisma.brand.findMany({
    where: { isActive: true },
    include: {
      productLines: { select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } },
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  })
})

/**
 * Cached active categories tree — shared across product listing pages.
 */
export const getActiveCategories = cache(async () => {
  return prisma.category.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  })
})
