import { prisma } from './db'

export type PromoType = 'percentage' | 'fixed' | 'price'
export type PromoAudience = 'all' | 'b2c' | 'b2b'

export interface Promo {
  type: PromoType
  value: number
  audience: PromoAudience
  badge: string | null
}

export interface ApplyPromoResult {
  price: number
  oldPrice: number | null
  badge: string | null
}

export function calcDiscountedPrice(basePrice: number, promo: Pick<Promo, 'type' | 'value'>): number {
  if (promo.type === 'percentage') return Math.round(basePrice * (1 - promo.value / 100))
  if (promo.type === 'fixed') return Math.max(0, basePrice - promo.value)
  if (promo.type === 'price') return promo.value
  return basePrice
}

// Pick the promotion that yields the lowest final price, restricted to the viewer's audience.
export function pickBestPromo(promos: Promo[], basePrice: number, role: string | null | undefined): Promo | null {
  const eligible = promos.filter((p) => p.audience === 'all' || p.audience === role)
  if (eligible.length === 0) return null
  return eligible.reduce((best, p) => {
    const bestPrice = calcDiscountedPrice(basePrice, best)
    const candidatePrice = calcDiscountedPrice(basePrice, p)
    return candidatePrice < bestPrice ? p : best
  })
}

// Apply the best eligible promotion to a base price. If the promotion reduces the price,
// the original price becomes `oldPrice` and a badge may be surfaced.
export function applyBestPromo(
  basePrice: number,
  existingOldPrice: number | null,
  promos: Promo[],
  role: string | null | undefined,
): ApplyPromoResult {
  const best = pickBestPromo(promos, basePrice, role)
  if (!best) return { price: basePrice, oldPrice: existingOldPrice, badge: null }

  const discounted = calcDiscountedPrice(basePrice, best)
  if (discounted < basePrice) {
    return { price: discounted, oldPrice: basePrice, badge: best.badge ?? null }
  }
  return { price: basePrice, oldPrice: existingOldPrice, badge: null }
}

// Fetch active, in-window promotions for a set of product IDs. Single query for N products.
// Returns a map keyed by productId so callers can merge promos with their product data.
export async function getActivePromosByProductId(productIds: string[]): Promise<Map<string, Promo[]>> {
  const out = new Map<string, Promo[]>()
  if (productIds.length === 0) return out

  try {
    const rows = await prisma.$queryRaw<Array<{
      product_id: string; type: string; value: number; audience: string; badge: string | null
    }>>`
      SELECT pp.product_id, pr.type, pr.value, pr.audience, pr.badge
      FROM promotion_products pp
      JOIN promotions pr ON pr.id = pp.promotion_id
      WHERE pp.product_id = ANY(${productIds})
        AND pr.is_active = true
        AND (pr.start_date IS NULL OR pr.start_date::date <= CURRENT_DATE)
        AND (pr.end_date IS NULL OR pr.end_date::date >= CURRENT_DATE)
    `
    for (const row of rows) {
      const arr = out.get(row.product_id) ?? []
      arr.push({
        type: row.type as PromoType,
        value: Number(row.value),
        audience: row.audience as PromoAudience,
        badge: row.badge,
      })
      out.set(row.product_id, arr)
    }
  } catch (err) {
    console.error('[pricing] Failed to fetch active promos:', err)
  }
  return out
}

// Revalidate every page that displays a price. Call after any promotion CRUD.
// Kept here so every mutation site uses the same (correct) list.
export async function revalidatePriceSurfaces() {
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/cart')
}
