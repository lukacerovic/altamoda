import type { MetadataRoute } from 'next'

const SITE = (process.env.SITE_URL || 'https://www.altamoda.rs').replace(/\/+$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/account', '/checkout', '/cart', '/wishlist', '/api/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
