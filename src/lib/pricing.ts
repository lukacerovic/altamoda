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
    // Same ORM relation-filter path as fetchActivePromosByProduct (promotions.ts);
    // keep the date logic in sync with the storefront "Na akciji" filter.
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
    for (const row of rows) {
      const arr = out.get(row.productId) ?? []
      arr.push({
        type: row.promotion.type as PromoType,
        value: Number(row.promotion.value),
        audience: row.promotion.audience as PromoAudience,
        badge: row.promotion.badge,
      })
      out.set(row.productId, arr)
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
  revalidatePath('/products/[id]')
  revalidatePath('/cart')
}
