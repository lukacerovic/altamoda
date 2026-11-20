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
// `role` may be 'b2c' | 'b2b' | 'admin' | undefined (guest). Guests are
// treated as B2C (retail) viewers; admins see every audience's promotion.
export function pickBestPromo(
  promos: ActivePromo[],
  basePrice: number,
  role: string | undefined,
): ActivePromo | null {
  const audiences = role === 'admin'
    ? ['all', 'b2c', 'b2b']
    : role === 'b2b'
      ? ['all', 'b2b']
      : ['all', 'b2c']
  const eligible = promos.filter(p => audiences.includes(p.audience))
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
    // Prisma ORM on purpose: the same relation-filter path used by the admin
    // panel and the storefront "Na akciji" filter. Keep the date logic here in
    // sync with those queries (full-timestamp comparison, not ::date casting).
    const now = new Date()
    const rows = await prisma.promotionProduct.findMany({
      where: {
        productId: { in: productIds },
        promotion: {
          isActive: true,
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: now } }] },
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ],
        },
      },
      select: {
        productId: true,
        promotion: {
          select: { type: true, value: true, audience: true, badge: true },
        },
      },
    })
    for (const r of rows) {
      const arr = result.get(r.productId) || []
      arr.push({
        type: r.promotion.type,
        value: Number(r.promotion.value),
        audience: r.promotion.audience,
        badge: r.promotion.badge,
      })
      result.set(r.productId, arr)
    }
  } catch (err) {
    console.error('[promotions] Failed to fetch active promotions:', err)
  }
  return result
}
