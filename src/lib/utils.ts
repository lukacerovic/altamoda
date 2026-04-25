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
  const seq = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0')
  return `${ORDER_PREFIX}-${year}-${seq}`
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

// ─── Relative time formatter ───
// Built-in Intl, no external date dep. Returns short Serbian strings like
// "Pre 5 min", "Pre 2 h", "Pre 3 d". Used by the admin notifications UI.
const _rtf = typeof Intl !== 'undefined' ? new Intl.RelativeTimeFormat('sr', { numeric: 'auto', style: 'short' }) : null

export function formatRelativeTime(iso: string | Date): string {
  if (!_rtf) return ''
  const t = typeof iso === 'string' ? new Date(iso).getTime() : iso.getTime()
  const diffSec = Math.round((t - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 60) return _rtf.format(diffSec, 'second')
  if (abs < 3600) return _rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return _rtf.format(Math.round(diffSec / 3600), 'hour')
  return _rtf.format(Math.round(diffSec / 86400), 'day')
}
