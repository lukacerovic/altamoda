import { describe, it, expect } from 'vitest'
import {
  CURRENCY, CURRENCY_SYMBOL, FREE_SHIPPING_THRESHOLD,
  ORDER_PREFIX, PAGINATION_DEFAULT_PAGE, PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT, MIN_B2B_ORDER, B2B_BULK_DISCOUNT,
  ERP_DEFAULT_VAT_RATE, ERP_VAT_CODES, ERP_WEB_ORDER_SOURCE,
  ERP_DOC_TYPE_SALES_ORDER, ERP_SYNC_MAX_RETRIES, ERP_SYNC_RETRY_DELAYS_MS,
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
