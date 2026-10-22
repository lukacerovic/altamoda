export const CURRENCY = 'RSD'
export const CURRENCY_SYMBOL = 'RSD'
// Delivery terms differ by customer type. Pickup at the Pro Shop (Mihizova 9/L3)
// is always free.
export const SHIPPING_COST = 500
export const FREE_SHIPPING_THRESHOLD_B2C = 6000
export const FREE_SHIPPING_THRESHOLD_B2B = 12000

export function getFreeShippingThreshold(isB2b: boolean): number {
  return isB2b ? FREE_SHIPPING_THRESHOLD_B2B : FREE_SHIPPING_THRESHOLD_B2C
}

export function getShippingCost(method: string | undefined, subtotal: number, isB2b: boolean): number {
  if (method === 'pickup') return 0
  return subtotal >= getFreeShippingThreshold(isB2b) ? 0 : SHIPPING_COST
}

export const ORDER_PREFIX = 'ALT'
export const PAGINATION_DEFAULT_PAGE = 1
export const PAGINATION_DEFAULT_LIMIT = 12
export const PAGINATION_MAX_LIMIT = 100
export const B2B_BULK_DISCOUNT = 15

// ERP / Pantheon sync constants
export const ERP_DEFAULT_VAT_RATE = 20
export const ERP_VAT_CODES = { R2: 20, R1: 10 } as const
export const ERP_WEB_ORDER_SOURCE = 'W'
export const ERP_DOC_TYPE_SALES_ORDER = 100
export const ERP_SYNC_MAX_RETRIES = 5
export const ERP_SYNC_RETRY_DELAYS_MS = [60_000, 300_000, 900_000, 3_600_000, 14_400_000] as const
