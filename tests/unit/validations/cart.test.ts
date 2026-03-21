import { describe, it, expect } from 'vitest'
import { addToCartSchema, updateCartItemSchema } from '@/lib/validations/cart'

describe('Cart Validations', () => {
  describe('addToCartSchema', () => {
    it('accepts valid productId and quantity', () => {
      const result = addToCartSchema.parse({ productId: 'prod-123', quantity: 1 })
      expect(result.productId).toBe('prod-123')
      expect(result.quantity).toBe(1)
    })

    it('accepts maximum quantity (999)', () => {
      const result = addToCartSchema.parse({ productId: 'prod-1', quantity: 999 })
      expect(result.quantity).toBe(999)
    })

    it('rejects quantity 0', () => {
      expect(() => addToCartSchema.parse({ productId: 'prod-1', quantity: 0 })).toThrow()
    })

    it('rejects quantity above 999', () => {
      expect(() => addToCartSchema.parse({ productId: 'prod-1', quantity: 1000 })).toThrow()
    })

    it('rejects negative quantity', () => {
      expect(() => addToCartSchema.parse({ productId: 'prod-1', quantity: -1 })).toThrow()
    })

    it('rejects fractional quantity', () => {
      expect(() => addToCartSchema.parse({ productId: 'prod-1', quantity: 1.5 })).toThrow()
    })

    it('rejects empty productId', () => {
      expect(() => addToCartSchema.parse({ productId: '', quantity: 1 })).toThrow()
    })

    it('coerces string quantity', () => {
      const result = addToCartSchema.parse({ productId: 'prod-1', quantity: '5' })
      expect(result.quantity).toBe(5)
    })
  })

  describe('updateCartItemSchema', () => {
    it('accepts valid quantity', () => {
      const result = updateCartItemSchema.parse({ quantity: 3 })
      expect(result.quantity).toBe(3)
    })

    it('rejects quantity 0', () => {
      expect(() => updateCartItemSchema.parse({ quantity: 0 })).toThrow()
    })

    it('rejects quantity above 999', () => {
      expect(() => updateCartItemSchema.parse({ quantity: 1000 })).toThrow()
    })

    it('coerces string quantity', () => {
      const result = updateCartItemSchema.parse({ quantity: '10' })
      expect(result.quantity).toBe(10)
    })
  })
})
