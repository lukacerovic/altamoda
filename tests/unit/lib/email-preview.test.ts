import { describe, it, expect } from 'vitest'
import {
  isFullEmailHtml,
  convertToEmailHtml,
  defaultEmailOptions,
  wrapInEmailTemplate,
  applyBodyBgImage,
  extractBodyBgImage,
  generateEmailPreview,
  extractBodyContent,
} from '@/lib/email-preview'

describe('email-preview — newsletter render pipeline', () => {
  describe('isFullEmailHtml()', () => {
    it('detects a full doctype-prefixed document', () => {
      expect(isFullEmailHtml('<!DOCTYPE html><html></html>')).toBe(true)
      expect(isFullEmailHtml('  <!DOCTYPE html>...')).toBe(true) // tolerates leading whitespace
    })

    it('detects documents starting with <html>', () => {
      expect(isFullEmailHtml('<html lang="sr">...</html>')).toBe(true)
    })

    it('returns false for a bare body snippet', () => {
      expect(isFullEmailHtml('<h1>Hi</h1><p>Content</p>')).toBe(false)
    })

    it('returns false for plain text', () => {
      expect(isFullEmailHtml('Hello world')).toBe(false)
    })
  })

  describe('convertToEmailHtml()', () => {
    it('inlines style attributes on h1/h2/h3 that have none', () => {
      const result = convertToEmailHtml('<h1>Title</h1><h2>Sub</h2><h3>Section</h3>')
      expect(result).toContain('<h1 style="')
      expect(result).toContain('<h2 style="')
      expect(result).toContain('<h3 style="')
    })

    it('inlines style on plain <p> tags', () => {
      const result = convertToEmailHtml('<p>Body text</p>')
      expect(result).toMatch(/<p[^>]*style="[^"]+"[^>]*>Body text<\/p>/)
    })

    it('preserves text-align on pre-styled paragraphs', () => {
      const result = convertToEmailHtml('<p style="text-align: center">Centered</p>')
      expect(result).toContain('text-align:center')
      expect(result).toContain('Centered')
    })

    it('does NOT override an element that already has inline style', () => {
      const input = '<h1 style="color:red">Kept</h1>'
      const result = convertToEmailHtml(input)
      // Existing style should survive (no double-application)
      expect(result).toContain('color:red')
      expect(result).toBe(input) // nothing changed
    })
  })

  describe('defaultEmailOptions', () => {
    it('has the expected Altamoda branding defaults', () => {
      expect(defaultEmailOptions.headerTitle).toBe('ALTAMODA')
      expect(defaultEmailOptions.footerText).toBe('Altamoda Heritage')
    })

    it('footerCopyright includes the current year', () => {
      const year = new Date().getFullYear()
      expect(defaultEmailOptions.footerCopyright).toContain(String(year))
    })
  })

  describe('wrapInEmailTemplate()', () => {
    it('returns a complete HTML document', () => {
      const out = wrapInEmailTemplate('<p>Hi</p>')
      expect(out).toMatch(/^<!DOCTYPE html>/)
      expect(out).toContain('</html>')
      expect(out).toContain('<p>Hi</p>')
    })

    it('embeds the provided unsubscribe URL in the footer', () => {
      const out = wrapInEmailTemplate('body', {}, 'https://example.com/unsubscribe/abc')
      expect(out).toContain('https://example.com/unsubscribe/abc')
    })

    it('falls back to a preview placeholder when no unsubscribe URL is given', () => {
      const out = wrapInEmailTemplate('body')
      expect(out).toContain('#preview-unsubscribe')
    })

    it('uses overridden header title when provided', () => {
      const out = wrapInEmailTemplate('body', { headerTitle: 'CUSTOM BRAND' })
      expect(out).toContain('CUSTOM BRAND')
    })

    it('renders the body between EMAIL_BODY markers (for round-trip extraction)', () => {
      const out = wrapInEmailTemplate('<p>Unique content here</p>')
      expect(out).toContain('<!-- EMAIL_BODY_START -->')
      expect(out).toContain('<!-- EMAIL_BODY_END -->')
      expect(out).toContain('<p>Unique content here</p>')
    })
  })

  describe('applyBodyBgImage() / extractBodyBgImage()', () => {
    it('replaces an existing background-image URL', () => {
      const body = `<div style="background-image: url('old.jpg');">X</div>`
      const out = applyBodyBgImage(body, 'new.jpg')
      expect(out).toContain("url('new.jpg')")
      expect(out).not.toContain('old.jpg')
    })

    it('returns body unchanged when no bgImageUrl is supplied', () => {
      const body = `<div style="background-image: url('keep.jpg');">X</div>`
      expect(applyBodyBgImage(body, undefined)).toBe(body)
    })

    it('extracts the first background-image URL from a body', () => {
      const body = `<div style="background-image: url('photo.jpg');">X</div>`
      expect(extractBodyBgImage(body)).toBe('photo.jpg')
    })

    it('returns undefined when no background-image is found', () => {
      expect(extractBodyBgImage('<p>nothing</p>')).toBeUndefined()
    })
  })

  describe('generateEmailPreview()', () => {
    it('passes through a full email document unchanged', () => {
      const full = '<!DOCTYPE html><html><body>X</body></html>'
      expect(generateEmailPreview(full)).toBe(full)
    })

    it('wraps a bare body snippet in the full template', () => {
      const result = generateEmailPreview('<h1>Headline</h1><p>Body</p>')
      expect(result).toMatch(/^<!DOCTYPE html>/)
      expect(result).toContain('Headline')
      expect(result).toContain('Body')
    })

    it('applies email-safe inline styles during wrapping', () => {
      const result = generateEmailPreview('<h1>Hi</h1>')
      expect(result).toMatch(/<h1[^>]+style="[^"]+">Hi<\/h1>/)
    })
  })

  describe('extractBodyContent()', () => {
    it('returns the input unchanged for a bare body snippet', () => {
      const snippet = '<p>not a full document</p>'
      expect(extractBodyContent(snippet)).toBe(snippet)
    })

    it('extracts content between EMAIL_BODY markers', () => {
      const full = generateEmailPreview('<p>round trip</p>')
      const extracted = extractBodyContent(full)
      expect(extracted).toContain('round trip')
      // The extracted content should be shorter than the full doc
      expect(extracted.length).toBeLessThan(full.length)
    })

    it('round-trip: generate → extract preserves content identity', () => {
      const body = '<h1>Naslov</h1><p>Sadržaj poruke.</p>'
      const full = generateEmailPreview(body)
      const extracted = extractBodyContent(full)
      // Both key strings survive
      expect(extracted).toContain('Naslov')
      expect(extracted).toContain('Sadržaj poruke.')
    })
  })
})
