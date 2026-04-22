import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/lib/cached-queries.ts'),
  'utf-8',
)

describe('cached-queries — React cache() deduplication', () => {
  it('imports the React cache() wrapper', () => {
    expect(source).toMatch(/import\s*{\s*cache\s*}\s*from\s*['"]react['"]/)
  })

  it('uses the prisma singleton (not new PrismaClient)', () => {
    expect(source).toMatch(/import\s*{[^}]*prisma[^}]*}\s*from\s*['"]@\/lib\/db['"]/)
    expect(source).not.toMatch(/new PrismaClient\(/)
  })

  it('exports getProductBySlugOrId wrapped in cache()', () => {
    expect(source).toMatch(/export const getProductBySlugOrId\s*=\s*cache\(/)
  })

  it('exports getActiveBrands wrapped in cache()', () => {
    expect(source).toMatch(/export const getActiveBrands\s*=\s*cache\(/)
  })

  it('exports getActiveCategories wrapped in cache()', () => {
    expect(source).toMatch(/export const getActiveCategories\s*=\s*cache\(/)
  })

  it('getProductBySlugOrId looks up by id OR slug (supports both)', () => {
    const block = source.split('getProductBySlugOrId')[1]
    expect(block).toMatch(/OR:\s*\[\s*\{\s*id\s*\}/)
    expect(block).toMatch(/\{\s*slug:\s*id\s*\}/)
  })

  it('getProductBySlugOrId filters to isActive products only', () => {
    const block = source.split('getProductBySlugOrId')[1]
    expect(block).toContain('isActive: true')
  })

  it('getActiveBrands filters to isActive brands only', () => {
    const block = source.split('getActiveBrands')[1].split('getActiveCategories')[0]
    expect(block).toContain('isActive: true')
  })

  it('every cache() call wraps an async function', () => {
    const cacheCallMatches = source.match(/cache\(\s*async/g)
    expect(cacheCallMatches).not.toBeNull()
    expect(cacheCallMatches!.length).toBeGreaterThanOrEqual(3)
  })

  it('module imports are valid (dynamic import smoke test)', async () => {
    const mod = await import('@/lib/cached-queries')
    expect(typeof mod.getProductBySlugOrId).toBe('function')
    expect(typeof mod.getActiveBrands).toBe('function')
    expect(typeof mod.getActiveCategories).toBe('function')
  })
})
