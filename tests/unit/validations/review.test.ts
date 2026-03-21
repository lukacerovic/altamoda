import { describe, it, expect } from 'vitest'
import { createReviewSchema } from '@/lib/validations/review'

describe('Review Validations', () => {
  it('accepts valid review with rating 1-5', () => {
    for (let rating = 1; rating <= 5; rating++) {
      const result = createReviewSchema.parse({ productId: 'prod-1', rating })
      expect(result.rating).toBe(rating)
    }
  })

  it('rejects rating of 0', () => {
    expect(() => createReviewSchema.parse({ productId: 'prod-1', rating: 0 })).toThrow()
  })

  it('rejects rating of 6', () => {
    expect(() => createReviewSchema.parse({ productId: 'prod-1', rating: 6 })).toThrow()
  })

  it('rejects negative rating', () => {
    expect(() => createReviewSchema.parse({ productId: 'prod-1', rating: -1 })).toThrow()
  })

  it('rejects fractional rating', () => {
    expect(() => createReviewSchema.parse({ productId: 'prod-1', rating: 3.5 })).toThrow()
  })

  it('coerces string rating to number', () => {
    const result = createReviewSchema.parse({ productId: 'prod-1', rating: '4' })
    expect(result.rating).toBe(4)
  })

  it('rejects empty productId', () => {
    expect(() => createReviewSchema.parse({ productId: '', rating: 5 })).toThrow()
  })

  it('rejects missing productId', () => {
    expect(() => createReviewSchema.parse({ rating: 5 })).toThrow()
  })

  it('rejects missing rating', () => {
    expect(() => createReviewSchema.parse({ productId: 'prod-1' })).toThrow()
  })
})
