import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

/**
 * Route-shape tests for the admin-only brand endpoints.
 *
 * These are file-level checks that verify the route handler modules export
 * the right HTTP methods, enforce admin auth, and guard against malformed
 * payloads. They do NOT hit a live database — full integration belongs to
 * a separate test suite with a dedicated test DB.
 */

const root = process.cwd()

describe('api/brands/[id]/route.ts — DELETE brand', () => {
  const routePath = path.join(root, 'src/app/api/brands/[id]/route.ts')
  const source = fs.readFileSync(routePath, 'utf-8')

  it('exports DELETE handler', () => {
    expect(source).toMatch(/export const DELETE\s*=/)
  })

  it('DELETE requires admin auth', () => {
    // Pull the DELETE handler block and verify requireAdmin() is called inside
    const deleteBlock = source.split(/export const DELETE/)[1]
    expect(deleteBlock).toBeTruthy()
    expect(deleteBlock).toContain('requireAdmin()')
  })

  it('DELETE detaches products (sets brandId=null) rather than deleting them', () => {
    const deleteBlock = source.split(/export const DELETE/)[1]
    expect(deleteBlock).toContain('updateMany')
    expect(deleteBlock).toContain('brandId: null')
  })

  it('DELETE removes product lines (brand-scoped)', () => {
    const deleteBlock = source.split(/export const DELETE/)[1]
    expect(deleteBlock).toContain('productLine.deleteMany')
  })

  it('DELETE uses a transaction for atomicity', () => {
    const deleteBlock = source.split(/export const DELETE/)[1]
    expect(deleteBlock).toContain('prisma.$transaction')
  })

  it('DELETE returns 404 when brand not found', () => {
    const deleteBlock = source.split(/export const DELETE/)[1]
    expect(deleteBlock).toMatch(/Brend nije pronađen.*404|404.*Brend nije pronađen/s)
  })

  it('GET and PUT handlers are still present (no regression)', () => {
    expect(source).toMatch(/export const GET\s*=/)
    expect(source).toMatch(/export const PUT\s*=/)
  })
})

describe('api/brands/[id]/products/route.ts — brand ↔ products assignment', () => {
  const routePath = path.join(root, 'src/app/api/brands/[id]/products/route.ts')

  it('route file exists', () => {
    expect(fs.existsSync(routePath)).toBe(true)
  })

  const source = fs.readFileSync(routePath, 'utf-8')

  it('exports GET, POST, and DELETE handlers', () => {
    expect(source).toMatch(/export const GET\s*=/)
    expect(source).toMatch(/export const POST\s*=/)
    expect(source).toMatch(/export const DELETE\s*=/)
  })

  it('every handler requires admin auth', () => {
    // Count occurrences of requireAdmin() — should appear at least 3 times
    const matches = source.match(/requireAdmin\(\)/g)
    expect(matches).not.toBeNull()
    expect(matches!.length).toBeGreaterThanOrEqual(3)
  })

  it('GET supports search and limit query params', () => {
    expect(source).toContain("searchParams.get('search')")
    expect(source).toContain("searchParams.get('limit')")
  })

  it('GET limit is capped to prevent abuse', () => {
    expect(source).toMatch(/Math\.min\(200/)
  })

  it('POST rejects empty productIds arrays', () => {
    expect(source).toContain('Nijedan proizvod nije prosleđen')
  })

  it('POST caps bulk attach at 500 products', () => {
    expect(source).toMatch(/productIds\.length > 500/)
  })

  it('POST reassigns productLineId to null on brand change (lines are brand-scoped)', () => {
    // When moving a product to a new brand, its old productLine becomes invalid
    expect(source).toContain('productLineId: null')
  })

  it('DELETE only detaches products currently in this brand (scoped update)', () => {
    // DELETE body should include brandId: id in its where clause
    const deleteBlock = source.split(/export const DELETE/)[1]
    expect(deleteBlock).toMatch(/brandId:\s*id/)
  })

  it('returns brand not found with 404', () => {
    expect(source).toContain('Brend nije pronađen')
  })
})
