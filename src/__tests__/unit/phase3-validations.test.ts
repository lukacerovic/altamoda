import { describe, it, expect } from 'vitest'
import { addToCartSchema, updateCartItemSchema } from '@/lib/validations/cart'
import { createReviewSchema } from '@/lib/validations/review'

// ─── Cart Validations ───

describe('addToCartSchema', () => {
  it('accepts valid add-to-cart data', () => {
    const result = addToCartSchema.safeParse({ productId: 'prod123', quantity: 2 })
    expect(result.success).toBe(true)
  })

  it('rejects empty productId', () => {
    expect(addToCartSchema.safeParse({ productId: '', quantity: 1 }).success).toBe(false)
  })

  it('rejects missing productId', () => {
    expect(addToCartSchema.safeParse({ quantity: 1 }).success).toBe(false)
  })

  it('rejects zero quantity', () => {
    expect(addToCartSchema.safeParse({ productId: 'prod1', quantity: 0 }).success).toBe(false)
  })

  it('rejects negative quantity', () => {
    expect(addToCartSchema.safeParse({ productId: 'prod1', quantity: -1 }).success).toBe(false)
  })

  it('rejects quantity over 999', () => {
    expect(addToCartSchema.safeParse({ productId: 'prod1', quantity: 1000 }).success).toBe(false)
  })

  it('accepts max allowed quantity (999)', () => {
    const result = addToCartSchema.safeParse({ productId: 'prod1', quantity: 999 })
    expect(result.success).toBe(true)
  })

  it('rejects non-integer quantity', () => {
    expect(addToCartSchema.safeParse({ productId: 'prod1', quantity: 1.5 }).success).toBe(false)
  })

  it('coerces string quantity to number', () => {
    const result = addToCartSchema.safeParse({ productId: 'prod1', quantity: '5' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.quantity).toBe(5)
    }
  })
})

describe('updateCartItemSchema', () => {
  it('accepts valid quantity', () => {
    expect(updateCartItemSchema.safeParse({ quantity: 3 }).success).toBe(true)
  })

  it('rejects zero quantity', () => {
    expect(updateCartItemSchema.safeParse({ quantity: 0 }).success).toBe(false)
  })

  it('rejects quantity over 999', () => {
    expect(updateCartItemSchema.safeParse({ quantity: 1000 }).success).toBe(false)
  })

  it('rejects missing quantity', () => {
    expect(updateCartItemSchema.safeParse({}).success).toBe(false)
  })
})

// ─── Review Validations ───

describe('createReviewSchema', () => {
  it('accepts valid review (rating 1)', () => {
    expect(createReviewSchema.safeParse({ productId: 'prod1', rating: 1 }).success).toBe(true)
  })

  it('accepts valid review (rating 5)', () => {
    expect(createReviewSchema.safeParse({ productId: 'prod1', rating: 5 }).success).toBe(true)
  })

  it('rejects rating 0', () => {
    expect(createReviewSchema.safeParse({ productId: 'prod1', rating: 0 }).success).toBe(false)
  })

  it('rejects rating 6', () => {
    expect(createReviewSchema.safeParse({ productId: 'prod1', rating: 6 }).success).toBe(false)
  })

  it('rejects non-integer rating', () => {
    expect(createReviewSchema.safeParse({ productId: 'prod1', rating: 3.5 }).success).toBe(false)
  })

  it('rejects empty productId', () => {
    expect(createReviewSchema.safeParse({ productId: '', rating: 4 }).success).toBe(false)
  })

  it('rejects missing productId', () => {
    expect(createReviewSchema.safeParse({ rating: 4 }).success).toBe(false)
  })

  it('rejects missing rating', () => {
    expect(createReviewSchema.safeParse({ productId: 'prod1' }).success).toBe(false)
  })

  it('coerces string rating to number', () => {
    const result = createReviewSchema.safeParse({ productId: 'prod1', rating: '4' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rating).toBe(4)
    }
  })
})
