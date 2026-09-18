import { describe, it, expect } from 'vitest'
import {
  CURRENCY, CURRENCY_SYMBOL,
  SHIPPING_COST, FREE_SHIPPING_THRESHOLD_B2C, FREE_SHIPPING_THRESHOLD_B2B,
  getFreeShippingThreshold, getShippingCost,
  ORDER_PREFIX, PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT, B2B_BULK_DISCOUNT,
  ERP_DEFAULT_VAT_RATE, ERP_VAT_CODES, ERP_WEB_ORDER_SOURCE,
  ERP_DOC_TYPE_SALES_ORDER, ERP_SYNC_MAX_RETRIES, ERP_SYNC_RETRY_DELAYS_MS,
} from '@/lib/constants'

describe('Constants', () => {
  it('has correct currency', () => {
    expect(CURRENCY).toBe('RSD')
    expect(CURRENCY_SYMBOL).toBe('RSD')
  })

  it('has correct shipping terms', () => {
    expect(SHIPPING_COST).toBe(500)
    expect(FREE_SHIPPING_THRESHOLD_B2C).toBe(6000)
    expect(FREE_SHIPPING_THRESHOLD_B2B).toBe(12000)
    expect(getFreeShippingThreshold(false)).toBe(6000)
    expect(getFreeShippingThreshold(true)).toBe(12000)
  })

  it('charges delivery below the role threshold and free at/above it', () => {
    expect(getShippingCost('standard', 5999, false)).toBe(500)
    expect(getShippingCost('standard', 6000, false)).toBe(0)
    expect(getShippingCost('standard', 11999, true)).toBe(500)
    expect(getShippingCost('standard', 12000, true)).toBe(0)
  })

  it('pickup is always free', () => {
    expect(getShippingCost('pickup', 100, false)).toBe(0)
    expect(getShippingCost('pickup', 100, true)).toBe(0)
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
    expect(B2B_BULK_DISCOUNT).toBe(15)
    expect(B2B_BULK_DISCOUNT).toBeGreaterThan(0)
    expect(B2B_BULK_DISCOUNT).toBeLessThanOrEqual(100)
  })

  it('has ERP/Pantheon sync constants', () => {
    expect(ERP_DEFAULT_VAT_RATE).toBe(20)
    expect(ERP_WEB_ORDER_SOURCE).toBe('W')
    expect(ERP_DOC_TYPE_SALES_ORDER).toBe(100)
    expect(ERP_SYNC_MAX_RETRIES).toBe(5)
  })

  it('has correct VAT code mapping', () => {
    expect(ERP_VAT_CODES.R2).toBe(20)
    expect(ERP_VAT_CODES.R1).toBe(10)
  })

  it('has correct number of retry delays matching max retries', () => {
    expect(ERP_SYNC_RETRY_DELAYS_MS).toHaveLength(ERP_SYNC_MAX_RETRIES)
  })

  it('has retry delays in ascending order', () => {
    for (let i = 1; i < ERP_SYNC_RETRY_DELAYS_MS.length; i++) {
      expect(ERP_SYNC_RETRY_DELAYS_MS[i]).toBeGreaterThan(ERP_SYNC_RETRY_DELAYS_MS[i - 1])
    }
  })
})
