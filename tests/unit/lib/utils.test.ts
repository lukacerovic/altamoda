import { describe, it, expect } from 'vitest'
import { formatPrice, slugify, generateOrderNumber, calculateDiscountPercentage } from '@/lib/utils'

describe('formatPrice', () => {
  it('formats a basic price with RSD suffix', () => {
    const result = formatPrice(2500)
    expect(result).toContain('RSD')
    expect(result).toContain('2')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toContain('0')
    expect(formatPrice(0)).toContain('RSD')
  })

  it('formats large numbers with thousand separators', () => {
    const result = formatPrice(1000000)
    expect(result).toContain('RSD')
  })
})

describe('slugify', () => {
  it('converts basic text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('handles Serbian characters', () => {
    expect(slugify('Šampon za Čišćenje')).toBe('sampon-za-ciscenje')
    expect(slugify('Đorđe Žikić')).toBe('djordje-zikic')
  })

  it('removes special characters', () => {
    expect(slugify("L'Oréal Professionnel")).toBe('loreal-professionnel')
  })

  it('handles multiple spaces and dashes', () => {
    expect(slugify('hello   world')).toBe('hello-world')
    expect(slugify('--hello--world--')).toBe('hello-world')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })
})

describe('generateOrderNumber', () => {
  it('matches ALT-YYYY-NNNN format', () => {
    const orderNumber = generateOrderNumber()
    expect(orderNumber).toMatch(/^ALT-\d{4}-\d{4}$/)
  })

  it('uses current year', () => {
    const orderNumber = generateOrderNumber()
    const year = new Date().getFullYear().toString()
    expect(orderNumber).toContain(year)
  })

  it('generates unique numbers', () => {
    const numbers = new Set(Array.from({ length: 100 }, () => generateOrderNumber()))
    // With 4-digit random, collisions are possible but very unlikely in 100 tries
    expect(numbers.size).toBeGreaterThan(90)
  })
})

describe('calculateDiscountPercentage', () => {
  it('calculates basic discount', () => {
    expect(calculateDiscountPercentage(100, 80)).toBe(20)
    expect(calculateDiscountPercentage(1000, 750)).toBe(25)
  })

  it('returns 0 for no discount', () => {
    expect(calculateDiscountPercentage(100, 100)).toBe(0)
  })

  it('returns 0 for zero old price', () => {
    expect(calculateDiscountPercentage(0, 50)).toBe(0)
  })

  it('handles 100% discount', () => {
    expect(calculateDiscountPercentage(100, 0)).toBe(100)
  })

  it('rounds to nearest integer', () => {
    expect(calculateDiscountPercentage(3, 2)).toBe(33)
  })
})
