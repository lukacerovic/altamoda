import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createRateLimiter, getClientIp, applyRateLimit } from '@/lib/rate-limit'

const stockCheckLimiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 30,       // 30 checks per minute
})

export async function POST(req: NextRequest) {
  // Rate limit to prevent inventory scraping
  const rateLimitResponse = await applyRateLimit(stockCheckLimiter, `stock:${getClientIp(req)}`)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { productIds } = await req.json()

    if (!Array.isArray(productIds) || productIds.length === 0 || productIds.length > 50) {
      return NextResponse.json({ success: true, data: {} })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stockQuantity: true },
    })

    // Return 1 (in stock) or 0 (out of stock), not exact quantities
    const stockMap: Record<string, number> = {}
    for (const p of products) {
      stockMap[p.id] = p.stockQuantity > 0 ? 1 : 0
    }

    return NextResponse.json({ success: true, data: stockMap })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to validate stock' },
      { status: 500 }
    )
  }
}
