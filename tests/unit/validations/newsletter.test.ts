import { describe, it, expect } from 'vitest'
import { subscribeSchema, unsubscribeSchema, newsletterFilterSchema } from '@/lib/validations/newsletter'

describe('Newsletter Validations', () => {
  describe('subscribeSchema', () => {
    it('accepts valid email with default segment (b2c)', () => {
      const result = subscribeSchema.parse({ email: 'test@example.com' })
      expect(result.email).toBe('test@example.com')
      expect(result.segment).toBe('b2c')
    })

    it('accepts valid email with b2b segment', () => {
      const result = subscribeSchema.parse({ email: 'salon@test.rs', segment: 'b2b' })
      expect(result.segment).toBe('b2b')
    })

    it('accepts valid email with b2c segment', () => {
      const result = subscribeSchema.parse({ email: 'user@test.rs', segment: 'b2c' })
      expect(result.segment).toBe('b2c')
    })

    it('rejects invalid email', () => {
      expect(() => subscribeSchema.parse({ email: 'not-an-email' })).toThrow()
    })

    it('rejects empty email', () => {
      expect(() => subscribeSchema.parse({ email: '' })).toThrow()
    })

    it('rejects missing email', () => {
      expect(() => subscribeSchema.parse({})).toThrow()
    })

    it('rejects invalid segment', () => {
      expect(() => subscribeSchema.parse({ email: 'test@test.com', segment: 'admin' })).toThrow()
    })
  })

  describe('unsubscribeSchema', () => {
    it('accepts valid email', () => {
      const result = unsubscribeSchema.parse({ email: 'test@example.com' })
      expect(result.email).toBe('test@example.com')
    })

    it('rejects invalid email', () => {
      expect(() => unsubscribeSchema.parse({ email: 'bad' })).toThrow()
    })

    it('rejects empty object', () => {
      expect(() => unsubscribeSchema.parse({})).toThrow()
    })
  })

  describe('newsletterFilterSchema', () => {
    it('provides defaults for all fields', () => {
      const result = newsletterFilterSchema.parse({})
      expect(result.search).toBe('')
      expect(result.segment).toBe('all')
      expect(result.page).toBe(1)
      expect(result.limit).toBe(12)
    })

    it('accepts valid search and segment', () => {
      const result = newsletterFilterSchema.parse({
        search: 'salon',
        segment: 'b2b',
        page: 2,
        limit: 20,
      })
      expect(result.search).toBe('salon')
      expect(result.segment).toBe('b2b')
      expect(result.page).toBe(2)
      expect(result.limit).toBe(20)
    })

    it('accepts segment "all"', () => {
      const result = newsletterFilterSchema.parse({ segment: 'all' })
      expect(result.segment).toBe('all')
    })

    it('rejects invalid segment', () => {
      expect(() => newsletterFilterSchema.parse({ segment: 'premium' })).toThrow()
    })

    it('coerces string page/limit to numbers', () => {
      const result = newsletterFilterSchema.parse({ page: '3', limit: '25' })
      expect(result.page).toBe(3)
      expect(result.limit).toBe(25)
    })

    it('rejects page less than 1', () => {
      expect(() => newsletterFilterSchema.parse({ page: 0 })).toThrow()
    })

    it('rejects limit greater than 100', () => {
      expect(() => newsletterFilterSchema.parse({ limit: 101 })).toThrow()
    })
  })
})
