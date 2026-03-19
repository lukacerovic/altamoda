import { describe, it, expect } from 'vitest'
import {
  CURRENCY, CURRENCY_SYMBOL, FREE_SHIPPING_THRESHOLD,
  ORDER_PREFIX, PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT, MIN_B2B_ORDER, B2B_BULK_DISCOUNT,
} from '@/lib/constants'

describe('Constants', () => {
  it('has correct currency', () => {
    expect(CURRENCY).toBe('RSD')
    expect(CURRENCY_SYMBOL).toBe('RSD')
  })

  it('has correct shipping threshold', () => {
    expect(FREE_SHIPPING_THRESHOLD).toBe(5000)
    expect(FREE_SHIPPING_THRESHOLD).toBeGreaterThan(0)
  })

  it('has correct order prefix', () => {
    expect(ORDER_PREFIX).toBe('ALT')
  })

  it('has valid pagination defaults', () => {
    expect(PAGINATION_DEFAULT_PAGE).toBe(1)
    expect(PAGINATION_DEFAULT_LIMIT).toBeGreaterThan(0)
    expect(PAGINATION_DEFAULT_LIMIT).toBeLessThanOrEqual(PAGINATION_MAX_LIMIT)
    expect(PAGINATION_MAX_LIMIT).toBe(100)
  })

  it('has B2B settings', () => {
    expect(MIN_B2B_ORDER).toBe(10000)
    expect(B2B_BULK_DISCOUNT).toBe(15)
    expect(B2B_BULK_DISCOUNT).toBeGreaterThan(0)
    expect(B2B_BULK_DISCOUNT).toBeLessThanOrEqual(100)
  })
})
