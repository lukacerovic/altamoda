export const CURRENCY = 'RSD'
export const CURRENCY_SYMBOL = 'RSD'
export const FREE_SHIPPING_THRESHOLD = 5000
export const ORDER_PREFIX = 'ALT'
export const PAGINATION_DEFAULT_PAGE = 1
export const PAGINATION_DEFAULT_LIMIT = 12
export const PAGINATION_MAX_LIMIT = 100
export const MIN_B2B_ORDER = 10000
export const B2B_BULK_DISCOUNT = 15

// ERP / Pantheon sync constants
export const ERP_DEFAULT_VAT_RATE = 20
export const ERP_VAT_CODES = { R2: 20, R1: 10 } as const
export const ERP_WEB_ORDER_SOURCE = 'W'
export const ERP_DOC_TYPE_SALES_ORDER = 100
export const ERP_SYNC_MAX_RETRIES = 5
export const ERP_SYNC_RETRY_DELAYS_MS = [60_000, 300_000, 900_000, 3_600_000, 14_400_000] as const
