import { describe, it, expect } from 'vitest'
import { expandDiacritics, buildSearchVariants } from '@/lib/fuzzy-search'

describe('fuzzy-search — variant expansion', () => {
  it('expands Serbian diacritics', () => {
    const variants = expandDiacritics('cetkica')
    expect(variants).toContain('cetkica')
    expect(variants).toContain('četkica')
  })

  it('treats é and e as the same letter', () => {
    const variants = buildSearchVariants('kerastase')
    expect(variants).toContain('kerastase')
    expect(variants).toContain('kérastase')
  })

  it('makes apostrophes optional and interchangeable', () => {
    const variants = buildSearchVariants("l'oreal")
    expect(variants).toContain('loreal')
    expect(variants).toContain("l'oreal")
    expect(variants).toContain('l’oreal')
  })

  it('inserts apostrophes for queries typed without them', () => {
    const variants = buildSearchVariants('loreal')
    expect(variants).toContain('loreal')
    expect(variants).toContain("l'oreal")
    expect(variants).toContain('l’oreal')
    expect(variants).toContain("l'oréal")
    expect(variants).toContain('l’oréal')
  })

  it('matches L’Oréal from the accented form too', () => {
    const variants = buildSearchVariants('l’oréal')
    expect(variants).toContain('loreal')
    expect(variants).toContain("l'oreal")
    expect(variants).toContain("l'oréal")
  })
})
