import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPromotionProducts(promotionIds: string[]): Promise<Map<string, any[]>> {
  if (promotionIds.length === 0) return new Map()

  // Query promotion_products join table with product details
  const rows = await prisma.$queryRaw<Array<{
    promotion_id: string
    product_id: string
    name_lat: string
    sku: string
    price_b2c: number
    brand_name: string | null
    category_name: string | null
    image_url: string | null
  }>>`
    SELECT pp.promotion_id, pp.product_id, p.name_lat, p.sku, p.price_b2c,
           b.name AS brand_name, c.name_lat AS category_name,
           (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS image_url
    FROM promotion_products pp
    JOIN products p ON p.id = pp.product_id
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE pp.promotion_id = ANY(${promotionIds})
  `

  const map = new Map<string, typeof rows>()
  for (const row of rows) {
    const arr = map.get(row.promotion_id) || []
    arr.push(row)
    map.set(row.promotion_id, arr)
  }
  return map
}

// GET /api/admin/promotions
export async function GET() {
  try {
    await requireAdmin()

    // Auto-delete expired promotions (end_date has passed)
    await prisma.$executeRaw`
      DELETE FROM promotion_products
      WHERE promotion_id IN (SELECT id FROM promotions WHERE end_date IS NOT NULL AND end_date < CURRENT_DATE)
    `
    await prisma.$executeRaw`
      DELETE FROM promotions WHERE end_date IS NOT NULL AND end_date < CURRENT_DATE
    `

    const promotions = await prisma.$queryRaw<Array<{
      id: string; name: string; type: string; value: number
      target_type: string; target_id: string | null; audience: string
      badge: string | null; start_date: Date | null; end_date: Date | null
      is_active: boolean; created_at: Date
    }>>`SELECT * FROM promotions ORDER BY created_at DESC`

    const productMap = await getPromotionProducts(promotions.map(p => p.id))

    const formatted = promotions.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      value: Number(p.value),
      targetType: p.target_type,
      targetId: p.target_id,
      audience: p.audience,
      badge: p.badge,
      startDate: p.start_date ? new Date(p.start_date).toISOString().split('T')[0] : null,
      endDate: p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : null,
      isActive: p.is_active,
      createdAt: new Date(p.created_at).toISOString(),
      products: (productMap.get(p.id) || []).map(pp => ({
        id: pp.product_id,
        name: pp.name_lat,
        sku: pp.sku,
        brand: pp.brand_name || '',
        category: pp.category_name || '',
        originalPrice: Number(pp.price_b2c),
        image: pp.image_url || '',
      })),
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    console.error('[promotions GET]', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const e = error as { statusCode: number; message: string }
      return NextResponse.json({ success: false, error: e.message }, { status: e.statusCode })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/promotions
export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()

    if (!body.name || !body.type || body.value === undefined) {
      return NextResponse.json({ success: false, error: 'Nedostaju obavezna polja' }, { status: 400 })
    }

    const promoId = `promo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const name = body.name
    const type = body.type
    const value = Number(body.value)
    const targetType = body.targetType || 'product'
    const targetId = body.targetId || null
    const audience = body.audience || 'all'
    const badge = body.badge || null
    const startDate = body.startDate ? new Date(body.startDate) : null
    const endDate = body.endDate ? new Date(body.endDate) : null

    await prisma.$executeRaw`
      INSERT INTO promotions (id, name, type, value, target_type, target_id, audience, badge, start_date, end_date, is_active, created_at)
      VALUES (${promoId}, ${name}, ${type}::"PromoType", ${value}, ${targetType}::"PromotionTargetType", ${targetId}, ${audience}::"Audience", ${badge}, ${startDate}, ${endDate}, true, NOW())
    `

    // Create product associations
    if (body.productIds?.length) {
      for (const pid of body.productIds) {
        const ppId = `pp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        await prisma.$executeRaw`
          INSERT INTO promotion_products (id, promotion_id, product_id)
          VALUES (${ppId}, ${promoId}, ${pid})
          ON CONFLICT DO NOTHING
        `
      }
    }

    // Fetch the created promotion with products
    const rows = await prisma.$queryRaw<Array<{
      id: string; name: string; type: string; value: number
      target_type: string; target_id: string | null; audience: string
      badge: string | null; start_date: Date | null; end_date: Date | null
      is_active: boolean; created_at: Date
    }>>`SELECT * FROM promotions WHERE id = ${promoId}`

    const p = rows[0]
    const productMap = await getPromotionProducts([promoId])

    return NextResponse.json({
      success: true,
      data: {
        id: p.id,
        name: p.name,
        type: p.type,
        value: Number(p.value),
        targetType: p.target_type,
        targetId: p.target_id,
        audience: p.audience,
        badge: p.badge,
        startDate: p.start_date ? new Date(p.start_date).toISOString().split('T')[0] : null,
        endDate: p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : null,
        isActive: p.is_active,
        createdAt: new Date(p.created_at).toISOString(),
        products: (productMap.get(p.id) || []).map(pp => ({
          id: pp.product_id,
          name: pp.name_lat,
          sku: pp.sku,
          brand: pp.brand_name || '',
          category: pp.category_name || '',
          originalPrice: Number(pp.price_b2c),
          image: pp.image_url || '',
        })),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[promotions POST]', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const e = error as { statusCode: number; message: string }
      return NextResponse.json({ success: false, error: e.message }, { status: e.statusCode })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/promotions — Delete all promotions
export async function DELETE() {
  try {
    await requireAdmin()
    await prisma.$executeRaw`DELETE FROM promotion_products`
    await prisma.$executeRaw`DELETE FROM promotions`
    return NextResponse.json({ success: true, data: { message: 'Sve akcije su obrisane' } })
  } catch (error) {
    console.error('[promotions DELETE]', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const e = error as { statusCode: number; message: string }
      return NextResponse.json({ success: false, error: e.message }, { status: e.statusCode })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
