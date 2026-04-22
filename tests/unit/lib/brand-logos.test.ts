import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { LOCAL_BRAND_LOGOS, resolveBrandLogo } from '@/lib/brand-logos'

describe('brand-logos — local logo fallback helper', () => {
  describe('LOCAL_BRAND_LOGOS map', () => {
    it('exports an object with string values only', () => {
      expect(typeof LOCAL_BRAND_LOGOS).toBe('object')
      for (const [slug, url] of Object.entries(LOCAL_BRAND_LOGOS)) {
        expect(typeof url, `${slug} should map to a string`).toBe('string')
        expect(url.length, `${slug} should have a non-empty path`).toBeGreaterThan(0)
      }
    })

    it('every entry points to /brands/ under public', () => {
      for (const [slug, url] of Object.entries(LOCAL_BRAND_LOGOS)) {
        expect(url, `${slug} should live under /brands/`).toMatch(/^\/brands\//)
      }
    })

    it('covers every legacy CMS slug that has a broken remote URL', () => {
      const requiredSlugs = [
        'matrix-biolage', 'biolage', 'biolage-raw',
        'elchim', 'framesi', 'kerastase', 'limage', 'loreal',
        'matrix', 'mizutani', 'olaplex',
        'olivia-garden', 'redken', 'redken-brews',
      ]
      for (const slug of requiredSlugs) {
        expect(LOCAL_BRAND_LOGOS[slug], `slug "${slug}" should be in the fallback map`).toBeDefined()
      }
    })

    it('every referenced local asset exists on disk', () => {
      const publicDir = path.join(process.cwd(), 'public')
      for (const [slug, url] of Object.entries(LOCAL_BRAND_LOGOS)) {
        const filePath = path.join(publicDir, url)
        expect(fs.existsSync(filePath), `Missing asset for ${slug}: ${url}`).toBe(true)
      }
    })

    it('all three Biolage variants resolve to the same file (shared logo)', () => {
      expect(LOCAL_BRAND_LOGOS['biolage']).toBe(LOCAL_BRAND_LOGOS['matrix-biolage'])
      expect(LOCAL_BRAND_LOGOS['biolage']).toBe(LOCAL_BRAND_LOGOS['biolage-raw'])
    })
  })

  describe('resolveBrandLogo()', () => {
    it('returns the local override when a slug is in the map', () => {
      expect(resolveBrandLogo('redken', 'https://broken.example/logo.webp')).toBe('/brands/redken.webp')
    })

    it('falls back to the DB logoUrl when the slug has no override', () => {
      expect(resolveBrandLogo('unknown-brand', 'https://cdn.example/logo.png')).toBe('https://cdn.example/logo.png')
    })

    it('returns null when slug has no override and DB value is null', () => {
      expect(resolveBrandLogo('unknown-brand', null)).toBeNull()
    })

    it('prefers the local override even when DB URL is valid (avoids drift)', () => {
      // Even if Biolage's DB URL worked, we want the local asset for consistency
      expect(resolveBrandLogo('biolage', 'https://valid-url.com/biolage.png')).toBe('/brands/biolage.webp')
    })

    it('treats empty-string logoUrl as a fallback miss', () => {
      // Empty string is falsy but not null — should still fall through to DB path
      const result = resolveBrandLogo('unknown', '')
      // Given the implementation (`LOCAL_BRAND_LOGOS[slug] || logoUrl`),
      // an empty string triggers the || branch and returns logoUrl (empty)
      expect(result === '' || result === null).toBe(true)
    })

    it('handles every slug in the map with a string return', () => {
      for (const slug of Object.keys(LOCAL_BRAND_LOGOS)) {
        const result = resolveBrandLogo(slug, null)
        expect(result).toBe(LOCAL_BRAND_LOGOS[slug])
      }
    })
  })
})
