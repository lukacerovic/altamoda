import { prisma } from '@/lib/db'

export type PromoType = 'percentage' | 'fixed' | 'price'
export type PromoAudience = 'all' | 'b2c' | 'b2b'

export interface ActivePromo {
  type: string
  value: number
  audience: string
  badge: string | null
}

export function calcDiscountedPrice(price: number, type: string, value: number): number {
  if (type === 'percentage') return Math.round(price * (1 - value / 100))
  if (type === 'fixed') return Math.max(0, price - value)
  if (type === 'price') return value
  return price
}

// Pick the promotion that yields the lowest price for a viewer's role.
// `role` may be 'b2c' | 'b2b' | 'admin' | undefined (guest); promotions
// targeted at 'all' are always eligible.
export function pickBestPromo(
  promos: ActivePromo[],
  basePrice: number,
  role: string | undefined,
): ActivePromo | null {
  const eligible = promos.filter(p => p.audience === 'all' || p.audience === role)
  if (eligible.length === 0) return null
  return eligible.reduce((best, p) =>
    calcDiscountedPrice(basePrice, p.type, p.value) <
    calcDiscountedPrice(basePrice, best.type, best.value)
      ? p
      : best,
  )
}

// Apply the best eligible promotion to a base price. Returns the new
// price + the previous (struck-through) price + an optional badge label.
export function applyBestPromo(
  promos: ActivePromo[],
  basePrice: number,
  existingOldPrice: number | null,
  role: string | undefined,
): { price: number; oldPrice: number | null; promoBadge: string | null } {
  const best = pickBestPromo(promos, basePrice, role)
  if (!best) return { price: basePrice, oldPrice: existingOldPrice, promoBadge: null }
  const discounted = calcDiscountedPrice(basePrice, best.type, best.value)
  if (discounted >= basePrice) {
    return { price: basePrice, oldPrice: existingOldPrice, promoBadge: null }
  }
  return { price: discounted, oldPrice: basePrice, promoBadge: best.badge ?? null }
}

// Fetch active, currently-running promotions for the given product IDs.
// Returns a map keyed by productId. Empty map on error (logs and continues).
export async function fetchActivePromosByProduct(
  productIds: string[],
): Promise<Map<string, ActivePromo[]>> {
  const result = new Map<string, ActivePromo[]>()
  if (productIds.length === 0) return result
  try {
    const rows = await prisma.$queryRaw<Array<{
      product_id: string
      type: string
      value: number
      audience: string
      badge: string | null
    }>>`
      SELECT pp.product_id, pr.type, pr.value, pr.audience, pr.badge
      FROM promotion_products pp
      JOIN promotions pr ON pr.id = pp.promotion_id
      WHERE pp.product_id = ANY(${productIds})
        AND pr.is_active = true
        AND (pr.start_date IS NULL OR pr.start_date::date <= CURRENT_DATE)
        AND (pr.end_date IS NULL OR pr.end_date::date >= CURRENT_DATE)
    `
    for (const r of rows) {
      const arr = result.get(r.product_id) || []
      arr.push({ type: r.type, value: Number(r.value), audience: r.audience, badge: r.badge })
      result.set(r.product_id, arr)
    }
  } catch (err) {
    console.error('[promotions] Failed to fetch active promotions:', err)
  }
  return result
}
