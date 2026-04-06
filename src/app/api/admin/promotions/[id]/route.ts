import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth-helpers'

async function getParams(context: unknown): Promise<{ id: string }> {
  const ctx = context as { params: Promise<{ id: string }> | { id: string } }
  return typeof ctx.params === 'object' && 'then' in ctx.params
    ? await ctx.params
    : ctx.params as { id: string }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPromotionWithProducts(id: string): Promise<any> {
  const rows = await prisma.$queryRaw<Array<{
    id: string; name: string; type: string; value: number
    target_type: string; target_id: string | null; audience: string
    badge: string | null; start_date: Date | null; end_date: Date | null
    is_active: boolean; created_at: Date
  }>>`SELECT * FROM promotions WHERE id = ${id}`
  if (rows.length === 0) return null
  const p = rows[0]

  const products = await prisma.$queryRaw<Array<{
    product_id: string
    name_lat: string
    sku: string
    price_b2c: number
    brand_name: string | null
    category_name: string | null
    image_url: string | null
  }>>`
    SELECT pp.product_id, p.name_lat, p.sku, p.price_b2c,
           b.name AS brand_name, c.name_lat AS category_name,
           (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS image_url
    FROM promotion_products pp
    JOIN products p ON p.id = pp.product_id
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE pp.promotion_id = ${id}
  `

  return {
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
    products: products.map(pp => ({
      id: pp.product_id,
      name: pp.name_lat,
      sku: pp.sku,
      brand: pp.brand_name || '',
      category: pp.category_name || '',
      originalPrice: Number(pp.price_b2c),
      image: pp.image_url || '',
    })),
  }
}

// PUT /api/admin/promotions/[id]
export async function PUT(req: Request, context: unknown) {
  try {
    await requireAdmin()
    const { id } = await getParams(context)
    const body = await req.json()

    // Check existence
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM promotions WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Akcija nije pronađena' }, { status: 404 })
    }

    // Build and execute raw UPDATE
    const name = body.name ?? null
    const type = body.type ?? null
    const value = body.value !== undefined ? Number(body.value) : null
    const targetType = body.targetType ?? null
    const targetId = body.targetId !== undefined ? body.targetId : undefined
    const audience = body.audience ?? null
    const badge = body.badge !== undefined ? body.badge : undefined
    const isActive = body.isActive !== undefined ? body.isActive : null
    const startDate = body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined
    const endDate = body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : undefined

    await prisma.$executeRaw`
      UPDATE promotions SET
        name = COALESCE(${name}, name),
        type = COALESCE(${type}::"PromoType", type),
        value = COALESCE(${value}::decimal, value),
        target_type = COALESCE(${targetType}::"PromotionTargetType", target_type),
        target_id = CASE WHEN ${targetId !== undefined} THEN ${targetId ?? null} ELSE target_id END,
        audience = COALESCE(${audience}::"Audience", audience),
        badge = CASE WHEN ${badge !== undefined} THEN ${badge ?? null} ELSE badge END,
        is_active = COALESCE(${isActive}::boolean, is_active),
        start_date = CASE WHEN ${startDate !== undefined} THEN ${startDate ?? null}::timestamp ELSE start_date END,
        end_date = CASE WHEN ${endDate !== undefined} THEN ${endDate ?? null}::timestamp ELSE end_date END
      WHERE id = ${id}
    `

    // Update product associations if provided
    if (body.productIds !== undefined) {
      await prisma.$executeRaw`DELETE FROM promotion_products WHERE promotion_id = ${id}`
      for (const pid of body.productIds) {
        const ppId = `pp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
        await prisma.$executeRaw`
          INSERT INTO promotion_products (id, promotion_id, product_id)
          VALUES (${ppId}, ${id}, ${pid})
          ON CONFLICT DO NOTHING
        `
      }
    }

    const result = await fetchPromotionWithProducts(id)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[promotions PUT]', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const e = error as { statusCode: number; message: string }
      return NextResponse.json({ success: false, error: e.message }, { status: e.statusCode })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/promotions/[id]
export async function DELETE(_req: Request, context: unknown) {
  try {
    await requireAdmin()
    const { id } = await getParams(context)

    const existing = await prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM promotions WHERE id = ${id}`
    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Akcija nije pronađena' }, { status: 404 })
    }

    await prisma.$executeRaw`DELETE FROM promotion_products WHERE promotion_id = ${id}`
    await prisma.$executeRaw`DELETE FROM promotions WHERE id = ${id}`

    return NextResponse.json({ success: true, data: { message: 'Akcija je obrisana' } })
  } catch (error) {
    console.error('[promotions DELETE]', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const e = error as { statusCode: number; message: string }
      return NextResponse.json({ success: false, error: e.message }, { status: e.statusCode })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/promotions/[id] — Toggle active
export async function PATCH(_req: Request, context: unknown) {
  try {
    await requireAdmin()
    const { id } = await getParams(context)

    const rows = await prisma.$queryRaw<Array<{ id: string; is_active: boolean }>>`SELECT id, is_active FROM promotions WHERE id = ${id}`
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Akcija nije pronađena' }, { status: 404 })
    }

    const newActive = !rows[0].is_active
    await prisma.$executeRaw`UPDATE promotions SET is_active = ${newActive} WHERE id = ${id}`

    return NextResponse.json({ success: true, data: { id, isActive: newActive } })
  } catch (error) {
    console.error('[promotions PATCH]', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const e = error as { statusCode: number; message: string }
      return NextResponse.json({ success: false, error: e.message }, { status: e.statusCode })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
