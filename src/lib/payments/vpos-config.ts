/**
 * Central configuration for the Nexi/SIA VPOS Redirect integration.
 *
 * Secrets (start key, API-result key) are read from server-only env vars and
 * MUST NEVER be imported into a `'use client'` module or sent to the browser.
 *
 * See docs/PAYMENT_VPOS.md for the full integration plan.
 */

/** Master on/off switch. Keep false until the bank issues the test profile. */
export const VPOS_ENABLED = process.env.VPOS_ENABLED === 'true'

export interface VposConfig {
  /** Gateway endpoint, e.g. https://virtualpostest.sia.eu/vpos/payments/main?PAGE=LAND */
  baseUrl: string
  /** Merchant shop identifier assigned by SIA VPOS. */
  shopId: string
  /** Secret for signing outbound payment-initiation messages (Start key). */
  startKey: string
  /** Secret for verifying inbound outcome messages + API calls (API-Result key). */
  apiResultKey: string
  /** ISO 4217 numeric currency code. RSD = 941. */
  currency: string
  /** Number of decimal places for the currency (RSD = 2). */
  exponent: string
}

/**
 * Reads and validates the VPOS configuration. Throws if a required secret is
 * missing, so a misconfigured deploy fails loudly instead of silently sending
 * unsigned/invalid requests.
 */
export function getVposConfig(): VposConfig {
  const cfg: VposConfig = {
    baseUrl: process.env.VPOS_BASE_URL ?? '',
    shopId: process.env.VPOS_SHOPID ?? '',
    startKey: process.env.VPOS_START_KEY ?? '',
    apiResultKey: process.env.VPOS_API_RESULT_KEY ?? '',
    currency: process.env.VPOS_CURRENCY ?? '941',
    exponent: process.env.VPOS_EXPONENT ?? '2',
  }

  const missing = (
    [
      ['VPOS_BASE_URL', cfg.baseUrl],
      ['VPOS_SHOPID', cfg.shopId],
      ['VPOS_START_KEY', cfg.startKey],
      ['VPOS_API_RESULT_KEY', cfg.apiResultKey],
    ] as const
  )
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length > 0) {
    throw new Error(`VPOS configuration is incomplete — missing env vars: ${missing.join(', ')}`)
  }

  return cfg
}
