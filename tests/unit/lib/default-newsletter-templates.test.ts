import { describe, it, expect } from 'vitest'
import { defaultTemplates } from '@/lib/default-newsletter-templates'

describe('default-newsletter-templates — seeded defaults', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(defaultTemplates)).toBe(true)
    expect(defaultTemplates.length).toBeGreaterThan(0)
  })

  it('contains the three expected template styles', () => {
    const names = defaultTemplates.map((t) => t.name)
    expect(names).toContain('Akcije')
    expect(names).toContain('Novo')
    expect(names).toContain('Info')
  })

  it('every template has all required fields', () => {
    for (const t of defaultTemplates) {
      expect(t.name, 'name').toBeTruthy()
      expect(t.description, `${t.name} description`).toBeTruthy()
      expect(t.subject, `${t.name} subject`).toBeTruthy()
      expect(t.htmlContent, `${t.name} htmlContent`).toBeTruthy()
    }
  })

  it('every htmlContent is substantial (>100 chars)', () => {
    for (const t of defaultTemplates) {
      expect(t.htmlContent.length, `${t.name} body is too short`).toBeGreaterThan(100)
    }
  })

  it('every htmlContent is a bare body (not a full document)', () => {
    // defaults are TipTap body HTML; wrapper is added at render time
    for (const t of defaultTemplates) {
      expect(t.htmlContent.trim().toLowerCase().startsWith('<!doctype')).toBe(false)
      expect(t.htmlContent.trim().toLowerCase().startsWith('<html')).toBe(false)
    }
  })

  it('template names are unique', () => {
    const names = defaultTemplates.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('subject lines are ASCII-safe and reasonably sized for inboxes', () => {
    for (const t of defaultTemplates) {
      expect(t.subject.length, `${t.name} subject length`).toBeLessThan(120)
      // We don't require pure ASCII (Serbian subjects are OK) but we reject controls
      expect(/[\x00-\x1F]/.test(t.subject)).toBe(false)
    }
  })
})
