/**
 * Pantheon (tkomserver) API types.
 *
 * Endpoint: POST http://89.216.106.135:8080/tkomserver/webshop/api
 * Auth: userEmail + userPass POST body fields
 * Actions: products | stock | altaorder
 *
 * The response uses single-letter keys to keep payloads small. Field meanings
 * below were verified against a live response on 2026-05-16 and corrected
 * on 2026-09-19: `e` was 0 for every article in May, which is why `c` was
 * used as the shop price — but `c` turned out to be the WHOLESALE price.
 * `e` is the retail price (verified: SKU 2723 c=2275.20, e=3720.00, and all
 * 272 priced products on the legacy site equal `e`).
 *
 *   a = product code (acIdent), may have trailing whitespace
 *   b = name (Serbian)
 *   c = wholesale price WITH VAT
 *   d = wholesale price WITHOUT VAT (cost / pre-VAT)
 *   e = retail price WITH VAT (0 when not set in Pantheon)
 *   f = stock quantity (string with decimals, e.g. "4.00")
 *   g = active flag ("T" / "F")
 *   h = always 0.0 (purpose unknown)
 */

export type PantheonAction = 'products' | 'stock' | 'altaorder'

/** Raw product row from action=products. */
export interface PantheonRawProduct {
  a: string | number // product code
  b: string // name
  c: number | string // wholesale price WITH VAT
  d?: number | string // wholesale price WITHOUT VAT (cost)
  e?: number | string // retail price WITH VAT (0 = not set)
  f: number | string // stock
  g: string // "T" / "F"
  h?: number | string // always 0.0 — kept for forward compat
}

/** Raw stock row from action=stock. Same shape as products but only `a` and `f` are reliable. */
export interface PantheonRawStock {
  a: string | number
  f: number | string
}

/** Envelope returned by action=products and action=stock. */
export interface PantheonProductsResponse {
  products: PantheonRawProduct[]
}

export interface PantheonStockResponse {
  products: PantheonRawStock[]
}

/** Order line item sent inside altaorder.data.items[]. */
export interface PantheonOrderItem {
  product_code: string
  quantity: number
  price: number
}

/**
 * Order payload sent as JSON string in altaorder.data.
 * Field names match the legacy CodeIgniter `send_order()` exactly.
 */
export interface PantheonOrderPayload {
  order_id: number | string
  first_name: string
  last_name: string
  email: string
  contact_phone: string
  city: string
  address: string
  postal_no: string
  company_name: string
  company_pib: string
  company_reg_number: string
  items_price: number
  shipping_price: number
  total_price: number
  /** "pouzecem" (COD) | "uplatnicom" (slip) | "karticom" (card) */
  payment_type: string
  ship_to_diff_address: 0 | 1
  shipping_first_name: string
  shipping_last_name: string
  shipping_email: string
  shipping_city: string
  shipping_address: string
  shipping_postal_no: string
  shipping_contact_phone: string
  additional_instructions: string
  /** Format: YYYY-MM-DD HH:mm:ss */
  order_date: string
  items: PantheonOrderItem[]
}

/**
 * Response from altaorder. Legacy PHP discards it — we don't know the exact shape yet.
 * Treat as opaque JSON until we observe a real response.
 */
export type PantheonOrderResponse = Record<string, unknown> | null

/** Normalized product after parsing (numbers coerced, code trimmed). */
export interface NormalizedPantheonProduct {
  code: string
  name: string
  priceWithoutVat: number
  priceWithVat: number
  /** Retail price with VAT (`e`); 0 when Pantheon has none. */
  retailPrice: number
  stock: number
  isActive: boolean
}

export interface NormalizedPantheonStock {
  code: string
  stock: number
}
