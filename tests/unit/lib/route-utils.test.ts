import { describe, it, expect } from 'vitest'
import { getRouteParams } from '@/lib/route-utils'

describe('getRouteParams', () => {
  it('extracts params from direct object', async () => {
    const context = { params: { id: 'abc123' } }
    const result = await getRouteParams<{ id: string }>(context)
    expect(result.id).toBe('abc123')
  })

  it('extracts params from Promise', async () => {
    const context = { params: Promise.resolve({ id: 'xyz789' }) }
    const result = await getRouteParams<{ id: string }>(context)
    expect(result.id).toBe('xyz789')
  })

  it('handles multiple params', async () => {
    const context = { params: { id: '1', slug: 'test-product' } }
    const result = await getRouteParams<{ id: string; slug: string }>(context)
    expect(result.id).toBe('1')
    expect(result.slug).toBe('test-product')
  })
})
