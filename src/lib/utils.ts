import { CURRENCY_SYMBOL, ORDER_PREFIX } from './constants'

export function formatPrice(price: number): string {
  return `${price.toLocaleString('sr-RS')} ${CURRENCY_SYMBOL}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/[š]/g, 's')
    .replace(/[ž]/g, 'z')
    .replace(/[đ]/g, 'dj')
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
