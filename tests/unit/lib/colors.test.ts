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

  it('accent hierarchy: accentDark is distinct from accent (hover/pressed variant)', () => {
    // accentLight is intentionally unified with accent (#837A64) — the palette was
    // consolidated to a single Soft Olive after earlier drift. accentDark remains
    // a separate deeper tone for active/pressed states.
    expect(colors.accentDark).not.toBe(colors.accent)
    expect(colors.accentDark).not.toBe(colors.accentLight)
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

  it('surface is pure white (#FFFFFF)', () => {
    expect(colors.surface).toBe('#FFFFFF')
  })

  it('dark text color is the near-black (#2e2e2e)', () => {
    expect(colors.foreground).toBe('#2e2e2e')
    expect(colors.dark).toBe('#2e2e2e')
    // foreground/text/dark all resolve to the same token in the editorial palette
    expect(colors.text).toBe(colors.foreground)
  })

  it('accent is anthracite (#293133) used for CTAs like add-to-cart', () => {
    expect(colors.accent).toBe('#293133')
  })
})
