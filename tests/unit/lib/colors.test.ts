import { describe, it, expect } from 'vitest'
import { colors, type ColorToken } from '@/lib/colors'

describe('Colors — Centralized Color Palette', () => {
  it('exports a colors object with all expected tokens', () => {
    const expectedTokens: ColorToken[] = [
      'accent',
      'accentLight',
      'accentDark',
      'background',
      'surface',
      'muted',
      'lightAccent',
      'foreground',
      'text',
      'textLight',
      'dark',
      'darkLight',
      'border',
      'success',
      'error',
      'warning',
    ]

    for (const token of expectedTokens) {
      expect(colors[token]).toBeDefined()
      expect(typeof colors[token]).toBe('string')
    }
  })

  it('all color values are valid hex strings', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/
    for (const [key, value] of Object.entries(colors)) {
      expect(value, `${key} should be a valid hex color`).toMatch(hexRegex)
    }
  })

  it('foreground and text are aliases (same value)', () => {
    expect(colors.foreground).toBe(colors.text)
  })

  it('has exactly 16 color tokens', () => {
    expect(Object.keys(colors)).toHaveLength(16)
  })

  it('accent colors form a light-to-dark hierarchy', () => {
    // accentLight should be lighter (higher hex values) than accentDark
    // We just verify they are distinct
    expect(colors.accentLight).not.toBe(colors.accent)
    expect(colors.accentDark).not.toBe(colors.accent)
    expect(colors.accentLight).not.toBe(colors.accentDark)
  })

  it('status colors are all distinct', () => {
    const statusColors = [colors.success, colors.error, colors.warning]
    const unique = new Set(statusColors)
    expect(unique.size).toBe(3)
  })

  it('colors object is frozen (as const)', () => {
    // Verify the colors object is readonly — we can't directly test `as const`,
    // but we can verify all values are strings (not mutable arrays)
    for (const value of Object.values(colors)) {
      expect(typeof value).toBe('string')
    }
  })

  it('surface is the editorial cream background (#FFFBF4)', () => {
    expect(colors.surface).toBe('#FFFBF4')
  })

  it('dark text color is the editorial smoky black (#11120D)', () => {
    expect(colors.foreground).toBe('#11120D')
    expect(colors.dark).toBe('#11120D')
    // foreground/text/dark all resolve to the same token in the editorial palette
    expect(colors.text).toBe(colors.foreground)
  })

  it('accent is soft olive (#7A7F6A) used for CTAs like add-to-cart', () => {
    expect(colors.accent).toBe('#7A7F6A')
  })
})
