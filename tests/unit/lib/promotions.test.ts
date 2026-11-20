import { describe, it, expect } from 'vitest'
import {
  calcDiscountedPrice,
  pickBestPromo,
  applyBestPromo,
  type ActivePromo,
} from '@/lib/promotions'

const pct = (value: number): ActivePromo => ({ type: 'percentage', value, audience: 'all', badge: 'AKCIJA' })
const fixed = (value: number): ActivePromo => ({ type: 'fixed', value, audience: 'all', badge: null })

describe('promotions — price helpers', () => {
  it('calculates percentage, fixed and fixed-price discounts', () => {
    expect(calcDiscountedPrice(1404, 'percentage', 20)).toBe(1123) // Math.round(1404 * 0.8)
    expect(calcDiscountedPrice(1404, 'fixed', 404)).toBe(1000)
    expect(calcDiscountedPrice(1404, 'fixed', 5000)).toBe(0)
    expect(calcDiscountedPrice(1404, 'price', 999)).toBe(999)
    expect(calcDiscountedPrice(1404, 'unknown', 20)).toBe(1404)
  })

  it('picks the promo with the lowest final price for the viewer role', () => {
    const promos: ActivePromo[] = [
      { type: 'percentage', value: 10, audience: 'all', badge: null },
      { type: 'fixed', value: 300, audience: 'b2b', badge: null },
      { type: 'price', value: 900, audience: 'all', badge: 'BLACK FRIDAY' },
    ]
    expect(pickBestPromo(promos, 1404, 'b2c')?.value).toBe(900)
    expect(pickBestPromo(promos, 1404, 'b2b')?.type).toBe('price') // 900 < 1104 (fixed 300)
    expect(pickBestPromo(promos, 'b2c')?.audience).toBe('all')
  })

  it('does not apply B2B-only promos to guests/B2C', () => {
    const promos: ActivePromo[] = [{ type: 'percentage', value: 50, audience: 'b2b', badge: null }]
    const applied = applyBestPromo(promos, 1404, null, 'b2c')
    expect(applied).toEqual({ price: 1404, oldPrice: null, promoBadge: null })
  })

  it('applies B2C-audience promos to guests (guests are retail viewers)', () => {
    const promos: ActivePromo[] = [{ type: 'percentage', value: 20, audience: 'b2c', badge: 'AKCIJA' }]
    const applied = applyBestPromo(promos, 1404, null, undefined)
    expect(applied.price).toBe(1123)
    expect(applied.oldPrice).toBe(1404)
    expect(applied.promoBadge).toBe('AKCIJA')
  })

  it('lets admin see every audience promo (b2c and b2b)', () => {
    const promos: ActivePromo[] = [
      { type: 'percentage', value: 10, audience: 'b2c', badge: 'AKCIJA' },
      { type: 'percentage', value: 30, audience: 'b2b', badge: null },
    ]
    const applied = applyBestPromo(promos, 1404, null, 'admin')
    expect(applied.price).toBe(Math.round(1404 * 0.7)) // best (b2b -30%)
    expect(applied.oldPrice).toBe(1404)
  })

  it('applies an eligible promo and moves the base price to oldPrice', () => {
    const applied = applyBestPromo([pct(20)], 1404, null, 'b2c')
    expect(applied.price).toBe(1123)
    expect(applied.oldPrice).toBe(1404)
    expect(applied.promoBadge).toBe('AKCIJA')
  })

  it('keeps the static oldPrice when no promo matches', () => {
    const applied = applyBestPromo([], 1404, 1500, 'b2c')
    expect(applied).toEqual({ price: 1404, oldPrice: 1500, promoBadge: null })
  })

  it('does not surface a promo that does not reduce the price', () => {
    const applied = applyBestPromo([fixed(0)], 1404, null, 'b2c')
    expect(applied).toEqual({ price: 1404, oldPrice: null, promoBadge: null })
  })
})
