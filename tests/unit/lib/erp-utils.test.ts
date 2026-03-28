import { describe, it, expect } from 'vitest'
import {
  pantheonIdToString,
  removeVat,
  vatAmount,
  stripRtf,
  normalizePostalCode,
} from '@/lib/utils'

describe('pantheonIdToString', () => {
  it('converts float to string without decimals', () => {
    expect(pantheonIdToString(10002.0)).toBe('10002')
    expect(pantheonIdToString(858.0)).toBe('858')
  })

  it('floors float values', () => {
    expect(pantheonIdToString(10002.7)).toBe('10002')
  })

  it('handles string input', () => {
    expect(pantheonIdToString('10002')).toBe('10002')
  })

  it('returns null for null/undefined/empty', () => {
    expect(pantheonIdToString(null)).toBeNull()
    expect(pantheonIdToString(undefined)).toBeNull()
    expect(pantheonIdToString('')).toBeNull()
  })

  it('handles large Pantheon IDs', () => {
    expect(pantheonIdToString(2601000000001)).toBe('2601000000001')
  })

  it('handles zero', () => {
    expect(pantheonIdToString(0)).toBe('0')
  })
})

describe('removeVat', () => {
  it('removes 20% VAT from price', () => {
    const result = removeVat(1200, 20)
    expect(result).toBeCloseTo(1000, 2)
  })

  it('removes 10% VAT from price', () => {
    const result = removeVat(1100, 10)
    expect(result).toBeCloseTo(1000, 2)
  })

  it('handles 0% VAT', () => {
    expect(removeVat(1000, 0)).toBe(1000)
  })

  it('handles zero price', () => {
    expect(removeVat(0, 20)).toBe(0)
  })
})

describe('vatAmount', () => {
  it('calculates VAT amount for 20%', () => {
    const result = vatAmount(1200, 20)
    expect(result).toBeCloseTo(200, 2)
  })

  it('calculates VAT amount for 10%', () => {
    const result = vatAmount(1100, 10)
    expect(result).toBeCloseTo(100, 2)
  })

  it('returns 0 for 0% VAT', () => {
    expect(vatAmount(1000, 0)).toBe(0)
  })

  it('returns 0 for zero price', () => {
    expect(vatAmount(0, 20)).toBe(0)
  })

  it('VAT + base price equals original', () => {
    const price = 2400
    const rate = 20
    const base = removeVat(price, rate)
    const vat = vatAmount(price, rate)
    expect(base + vat).toBeCloseTo(price, 10)
  })
})

describe('stripRtf', () => {
  it('strips RTF formatting to plain text', () => {
    const rtf = '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}{\\pard Napomena za isporuku\\par}}'
    const result = stripRtf(rtf)
    expect(result).toContain('Napomena za isporuku')
    expect(result).not.toContain('\\rtf')
    expect(result).not.toContain('{')
  })

  it('returns plain text as-is', () => {
    expect(stripRtf('plain text note')).toBe('plain text note')
  })

  it('handles null/undefined/empty', () => {
    expect(stripRtf(null)).toBe('')
    expect(stripRtf(undefined)).toBe('')
    expect(stripRtf('')).toBe('')
  })

  it('handles RTF with font tables', () => {
    const rtf = '{\\rtf1\\ansi{\\fonttbl{\\f0\\fswiss Arial;}}{\\colortbl;\\red0\\green0\\blue0;}\\f0 Test content}'
    const result = stripRtf(rtf)
    expect(result).toContain('Test content')
  })
})

describe('normalizePostalCode', () => {
  it('strips RS- prefix', () => {
    expect(normalizePostalCode('RS-11000')).toBe('11000')
    expect(normalizePostalCode('RS-21000')).toBe('21000')
  })

  it('handles lowercase rs- prefix', () => {
    expect(normalizePostalCode('rs-11000')).toBe('11000')
  })

  it('returns code without prefix unchanged', () => {
    expect(normalizePostalCode('11000')).toBe('11000')
  })

  it('handles null/undefined/empty', () => {
    expect(normalizePostalCode(null)).toBe('')
    expect(normalizePostalCode(undefined)).toBe('')
    expect(normalizePostalCode('')).toBe('')
  })

  it('handles non-Serbian postal codes', () => {
    expect(normalizePostalCode('ME-81000')).toBe('ME-81000')
  })
})
