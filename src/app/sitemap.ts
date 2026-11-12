import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'

// Rendered on request (not at build time) so the build never needs the DB.
export const dynamic = 'force-dynamic'

const SITE = (process.env.SITE_URL || 'https://www.altamoda.rs').replace(/\/+$/, '')

const STATIC_PATHS = [
  '',
  '/products',
  '/brands',
  '/colors',
  '/education',
  '/about',
  '/contact',
  '/faq',
  '/uslovi-placanja',
  '/politika-kolacica',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE}${path}`,
  }))

  try {
    const [products, brands] = await Promise.all([
      prisma.product.findMany({
        // The VPOS 1 RSD product exists only for payment tests.
        where: { isActive: true, NOT: { sku: 'VPOS-TEST-1RSD' } },
        select: { slug: true, updatedAt: true },
      }),
      prisma.brand.findMany({ where: { isActive: true }, select: { slug: true } }),
    ])
    for (const p of products) {
      entries.push({ url: `${SITE}/products/${p.slug}`, lastModified: p.updatedAt })
    }
    for (const b of brands) {
      entries.push({ url: `${SITE}/brands/${b.slug}` })
    }
  } catch (err) {
    // Keep serving the static part rather than a 500 if the DB is unreachable.
    console.error('[sitemap] DB query failed', err)
  }

  return entries
}
