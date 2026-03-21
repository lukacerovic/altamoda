import { describe, it, expect } from 'vitest'
import { paginationSchema, idSchema } from '@/lib/validations/common'

describe('Common Validations', () => {
  describe('paginationSchema', () => {
    it('provides defaults (page 1, limit 12)', () => {
      const result = paginationSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(12)
    })

    it('coerces string values', () => {
      const result = paginationSchema.parse({ page: '5', limit: '50' })
      expect(result.page).toBe(5)
      expect(result.limit).toBe(50)
    })

    it('rejects page 0', () => {
      expect(() => paginationSchema.parse({ page: 0 })).toThrow()
    })

    it('rejects negative page', () => {
      expect(() => paginationSchema.parse({ page: -1 })).toThrow()
    })

    it('rejects limit 0', () => {
      expect(() => paginationSchema.parse({ limit: 0 })).toThrow()
    })

    it('rejects limit above 100', () => {
      expect(() => paginationSchema.parse({ limit: 101 })).toThrow()
    })

    it('accepts limit exactly 100', () => {
      const result = paginationSchema.parse({ limit: 100 })
      expect(result.limit).toBe(100)
    })

    it('rejects fractional page', () => {
      expect(() => paginationSchema.parse({ page: 1.5 })).toThrow()
    })
  })

  describe('idSchema', () => {
    it('accepts valid ID string', () => {
      const result = idSchema.parse({ id: 'clx1234567890' })
      expect(result.id).toBe('clx1234567890')
    })

    it('rejects empty ID', () => {
      expect(() => idSchema.parse({ id: '' })).toThrow()
    })

    it('rejects missing ID', () => {
      expect(() => idSchema.parse({})).toThrow()
    })
  })
})
