import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { productIds } = await req.json()

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: true, data: {} })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stockQuantity: true },
    })

    const stockMap: Record<string, number> = {}
    for (const p of products) {
      stockMap[p.id] = p.stockQuantity
    }

    return NextResponse.json({ success: true, data: stockMap })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to validate stock' },
      { status: 500 }
    )
  }
}
