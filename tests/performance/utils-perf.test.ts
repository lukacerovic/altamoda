import { describe, it, expect } from 'vitest'
import { formatPrice, slugify, generateOrderNumber, calculateDiscountPercentage } from '@/lib/utils'

/**
 * Performance tests — measure execution time of critical utility functions
 * under load. These validate that core functions remain fast at scale.
 */

const ITERATIONS = 10_000

function measure(fn: () => void): number {
  const start = performance.now()
  fn()
  return performance.now() - start
}

describe('Performance — Utility Functions', () => {
  it(`formatPrice: ${ITERATIONS} calls under 100ms`, () => {
    const ms = measure(() => {
      for (let i = 0; i < ITERATIONS; i++) {
        formatPrice(i * 100 + 0.99)
      }
    })
    expect(ms).toBeLessThan(100)
  })

  it(`slugify: ${ITERATIONS} calls under 200ms`, () => {
    const inputs = [
      'Šampon za kosu',
      'Boja za kosu — Pepeljasto Plava',
      'Redken All Soft Conditioner 300ml',
      'Крем за негу косе',
      'Framesi Morphosis Color Protect',
    ]
    const ms = measure(() => {
      for (let i = 0; i < ITERATIONS; i++) {
        slugify(inputs[i % inputs.length])
      }
    })
    expect(ms).toBeLessThan(200)
  })

  it(`generateOrderNumber: ${ITERATIONS} calls under 100ms`, () => {
    const ms = measure(() => {
      for (let i = 0; i < ITERATIONS; i++) {
        generateOrderNumber()
      }
    })
    expect(ms).toBeLessThan(100)
  })

  it(`calculateDiscountPercentage: ${ITERATIONS} calls under 50ms`, () => {
    const ms = measure(() => {
      for (let i = 0; i < ITERATIONS; i++) {
        calculateDiscountPercentage(2000 + i, 1500)
      }
    })
    expect(ms).toBeLessThan(50)
  })

  it('generateOrderNumber produces unique values across 1000 calls', () => {
    const numbers = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      numbers.add(generateOrderNumber())
    }
    // With random 4-digit seq, collisions are possible but rare in 1000 calls
    expect(numbers.size).toBeGreaterThan(900)
  })
})
