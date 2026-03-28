import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.altamoda.rs'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/cart',
          '/checkout/',
          '/wishlist',
          '/quick-order',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
