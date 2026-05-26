import { CURRENCY_SYMBOL, ORDER_PREFIX } from './constants'

export function formatPrice(price: number): string {
  return `${price.toLocaleString('sr-RS')} ${CURRENCY_SYMBOL}`
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/[š]/g, 's')
    .replace(/[ž]/g, 'z')
    .replace(/[đ]/g, 'dj')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  // 8 hex chars (~4.3B values/year) of CSPRNG entropy. The DB @unique on
  // Order.orderNumber is the final guard; this just makes a clash vanishingly
  // unlikely. Must stay within SIA VPOS ORDERID regex [a-zA-Z0-9\-_] and unique
  // for 5+ years, since orderNumber is sent to the gateway as ORDERID.
  const bytes = new Uint8Array(4)
  globalThis.crypto.getRandomValues(bytes)
  const rand = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  return `${ORDER_PREFIX}-${year}-${rand}`
}

export function calculateDiscountPercentage(
  oldPrice: number,
  newPrice: number
): number {
  if (oldPrice <= 0) return 0
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100)
}

// ─── ERP / Pantheon Helpers ───

/** Convert Pantheon float ID to string (avoids float precision issues) */
export function pantheonIdToString(id: number | string | null | undefined): string | null {
  if (id == null || id === '') return null
  return String(typeof id === 'number' ? Math.floor(id) : id)
}

/** Remove VAT from a VAT-inclusive price */
export function removeVat(priceWithVat: number, vatRate: number): number {
  return priceWithVat / (1 + vatRate / 100)
}

/** Calculate VAT amount from a VAT-inclusive price */
export function vatAmount(priceWithVat: number, vatRate: number): number {
  return priceWithVat - removeVat(priceWithVat, vatRate)
}

/** Strip RTF formatting from Pantheon note fields to plain text */
export function stripRtf(rtf: string | null | undefined): string {
  if (!rtf || !rtf.startsWith('{\\rtf')) return rtf || ''
  return rtf
    .replace(/\{\\fonttbl[^}]*\}/g, '')       // Remove font table
    .replace(/\{\\colortbl[^}]*\}/g, '')       // Remove color table
    .replace(/\{\\stylesheet[^}]*\}/g, '')     // Remove stylesheet
    .replace(/\\[a-z]+\d*\s?/gi, '')           // Remove RTF commands (\par, \pard, etc.)
    .replace(/[{}]/g, '')                      // Remove remaining braces
    .replace(/\r?\n/g, ' ')                    // Normalize whitespace
    .replace(/\s+/g, ' ')                      // Collapse multiple spaces
    .trim()
}

/** Strip "RS-" prefix from Pantheon postal codes (e.g., "RS-11000" → "11000") */
export function normalizePostalCode(code: string | null | undefined): string {
  if (!code) return ''
  return code.replace(/^RS-/i, '')
}
