/**
 * Nexi/SIA VPOS Redirect — message signing and verification.
 *
 * The MAC (Message Authentication Code) is an HMAC-SHA256 over a fixed-order
 * concatenation of fields, hex-encoded. Two different secret keys are used:
 *  - Start key       → signs the outbound payment-initiation message.
 *  - API-Result key  → verifies the inbound outcome message (URLMS/URLDONE).
 *
 * Field order is mandatory and case-sensitive in the field NAMES. The MAC value
 * itself is NOT case-sensitive. Formulas are taken verbatim from the official
 * WooCommerce plugin (generateMAC_request / generateMAC_outcome) and validated
 * in tests against SIA's own published sample hash. See docs/PAYMENT_VPOS.md.
 */
import { createHmac, timingSafeEqual } from 'crypto'
import type { VposConfig } from './vpos-config'

/**
 * Canonical field order for the REQUEST MAC (PDF §5.2.1).
 * A field is included only when present (non-null/undefined). An empty string
 * counts as present, so to sign `&3DSDATA=` set 3DSDATA to ''. Fields POSTed but
 * absent here (URLBACK, LANG, EMAIL, SHOPEMAIL, MAC) are intentionally excluded.
 */
const REQUEST_MAC_ORDER = [
  'URLMS', 'URLDONE', 'ORDERID', 'SHOPID', 'AMOUNT', 'CURRENCY', 'EXPONENT',
  'ACCOUNTINGMODE', 'AUTHORMODE', 'OPTIONS', 'NAME', 'SURNAME', 'TAXID', 'LOCKCARD',
  'COMMIS', 'ORDDESCR', 'VSID', 'OPDESCR', 'REMAININGDURATION', 'USERID',
  'PHONENUMBER', 'CAUSATION', 'USER', 'PRODUCTREF', 'ANTIFRAUD', '3DSDATA',
  'TRECURR', 'URLMSHEADER', 'INSTALLMENTSNUMBER', 'TICKLERPLAN',
] as const

/**
 * Canonical field order for the OUTCOME MAC (plugin generateMAC_outcome string
 * build, lines 2478+). The first 5 + TRANSACTIONID..TRANSACTIONTYPE are always
 * present; the rest are appended only when the gateway returns them.
 */
const OUTCOME_MAC_ORDER = [
  'ORDERID', 'SHOPID', 'AUTHNUMBER', 'AMOUNT', 'CURRENCY', 'EXPONENT',
  'TRANSACTIONID', 'ACCOUNTINGMODE', 'AUTHORMODE', 'RESULT', 'TRANSACTIONTYPE',
  'ISSUERCOUNTRY', 'AUTHCODE', 'PAYERID', 'PAYER', 'PAYERSTATUS', 'HASHPAN',
  'PANALIASREV', 'PANALIAS', 'PANALIASEXPDATE', 'PANALIASTAIL', 'MASKEDPAN',
  'TRECURR', 'CRECURR', 'PANTAIL', 'PANEXPIRYDATE', 'ACCOUNTHOLDER', 'IBAN',
  'ALIASSTR', 'AHEMAIL', 'AHTAXID', 'ACQUIRERBIN', 'MERCHANTID', 'CARDTYPE',
  'AMAZONAUTHID', 'AMAZONCAPTUREID', 'CHINFO', 'PANCODE',
] as const

export type VposFields = Record<string, string | undefined>

/** RESULT code returned by SIA. '00' = success; anything else = declined. */
export const VPOS_RESULT_SUCCESS = '00'

/** Builds the `KEY=value&KEY=value` string for the MAC, in the given order. */
function buildMacString(fields: VposFields, order: readonly string[]): string {
  const parts: string[] = []
  for (const key of order) {
    const v = fields[key]
    if (v !== undefined && v !== null) parts.push(`${key}=${v}`)
  }
  return parts.join('&')
}

function hmacHex(message: string, key: string): string {
  return createHmac('sha256', key).update(message, 'utf8').digest('hex')
}

/** Constant-time, case-insensitive comparison of two hex MAC strings. */
function macEquals(a: string, b: string): boolean {
  const x = Buffer.from(a.toLowerCase(), 'utf8')
  const y = Buffer.from(b.toLowerCase(), 'utf8')
  if (x.length !== y.length) return false
  return timingSafeEqual(x, y)
}

/** Signs an outbound payment-initiation message with the Start key. */
export function signRequest(fields: VposFields, startKey: string): string {
  return hmacHex(buildMacString(fields, REQUEST_MAC_ORDER), startKey)
}

/** Recomputes the outcome MAC from the received params using the API-Result key. */
export function computeOutcomeMac(params: URLSearchParams, apiResultKey: string): string {
  const fields: VposFields = {}
  for (const key of OUTCOME_MAC_ORDER) {
    if (params.has(key)) fields[key] = params.get(key) ?? ''
  }
  return hmacHex(buildMacString(fields, OUTCOME_MAC_ORDER), apiResultKey)
}

/**
 * Verifies the MAC of an inbound outcome message (URLMS or URLDONE).
 * Unknown/future params are ignored (they are not in OUTCOME_MAC_ORDER).
 */
export function verifyOutcome(
  params: URLSearchParams,
  apiResultKey: string
): { valid: boolean; result: string | null } {
  const received = params.get('MAC') ?? ''
  const computed = computeOutcomeMac(params, apiResultKey)
  return { valid: received.length > 0 && macEquals(received, computed), result: params.get('RESULT') }
}

/** Converts a major-unit amount (e.g. 5000.00 RSD) to minor units ("500000"). */
export function toMinorUnits(total: number, exponent = 2): string {
  return String(Math.round(total * 10 ** exponent))
}

export interface PaymentRequestInput {
  orderNumber: string
  /** Order total in major currency units (RSD). */
  total: number
  urls: { urlBack: string; urlDone: string; urlMs: string }
  /** Optional customer email — prefilled on the SIA page if provided. */
  email?: string
  /** Merchant notification email (SHOPEMAIL). */
  shopEmail?: string
  /** UI language on the SIA page. SR = Serbian (Latin), SC = Cyrillic. */
  lang?: string
}

export interface PaymentRequest {
  /** Form action URL (the gateway endpoint). */
  actionUrl: string
  /** Hidden form fields to POST, including the computed MAC. */
  fields: Record<string, string>
}

/**
 * Assembles the signed field set for the redirect POST form.
 *
 * Fixed policy: immediate auth + booking (AUTHORMODE/ACCOUNTINGMODE = I),
 * OPTION G (on success, skip SIA's receipt and bounce straight back to URLDONE).
 * 3DSDATA is intentionally omitted in Phase 1 (valid; add later for 3DS2 uplift).
 */
export function buildPaymentRequest(input: PaymentRequestInput, config: VposConfig): PaymentRequest {
  const fields: VposFields = {
    URLMS: input.urls.urlMs,
    URLDONE: input.urls.urlDone,
    ORDERID: input.orderNumber,
    SHOPID: config.shopId,
    AMOUNT: toMinorUnits(input.total, Number(config.exponent)),
    CURRENCY: config.currency,
    EXPONENT: config.exponent,
    ACCOUNTINGMODE: 'I',
    AUTHORMODE: 'I',
    OPTIONS: 'G',
    // POSTed but excluded from the MAC by REQUEST_MAC_ORDER:
    URLBACK: input.urls.urlBack,
    LANG: input.lang ?? 'SR',
    ...(input.email ? { EMAIL: input.email } : {}),
    ...(input.shopEmail ? { SHOPEMAIL: input.shopEmail } : {}),
  }

  const mac = signRequest(fields, config.startKey)

  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null) out[k] = v
  }
  out.MAC = mac

  return { actionUrl: config.baseUrl, fields: out }
}
