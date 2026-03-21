import { describe, it, expect } from 'vitest'
import { useCartStore } from '@/lib/stores/cart-store'
import { useWishlistStore } from '@/lib/stores/wishlist-store'
import { useAuthStore } from '@/lib/stores/auth-store'

/**
 * Performance tests — measure Zustand store operation throughput.
 * Ensures state management remains responsive under high-frequency updates.
 */

const ITERATIONS = 500

function measure(fn: () => void): number {
  const start = performance.now()
  fn()
  return performance.now() - start
}

describe('Performance — Zustand Stores', () => {
  describe('Cart Store', () => {
    it(`addItem: ${ITERATIONS} operations under 500ms`, () => {
      useCartStore.setState({ items: [] })
      const ms = measure(() => {
        for (let i = 0; i < ITERATIONS; i++) {
          useCartStore.getState().addItem({
            productId: `prod-${i}`,
            name: `Product ${i}`,
            brand: 'Redken',
            price: 1500,
            quantity: 1,
            image: '/img.jpg',
            sku: `SKU-${i}`,
            stockQuantity: 100,
          })
        }
      })
      expect(ms).toBeLessThan(500)
      expect(useCartStore.getState().items.length).toBe(ITERATIONS)
      useCartStore.setState({ items: [] })
    })

    it(`getTotal with ${ITERATIONS} items under 50ms`, () => {
      const items = Array.from({ length: ITERATIONS }, (_, i) => ({
        id: `id-${i}`,
        productId: `prod-${i}`,
        name: `Product ${i}`,
        brand: 'Redken',
        price: 1500,
        quantity: 2,
        image: '/img.jpg',
        sku: `SKU-${i}`,
        stockQuantity: 100,
      }))
      useCartStore.setState({ items })

      const ms = measure(() => {
        for (let i = 0; i < 100; i++) {
          useCartStore.getState().getTotal()
        }
      })
      expect(ms).toBeLessThan(50)
      useCartStore.setState({ items: [] })
    })

    it(`removeItem: ${ITERATIONS} operations under 500ms`, () => {
      const items = Array.from({ length: ITERATIONS }, (_, i) => ({
        id: `id-${i}`,
        productId: `prod-${i}`,
        name: `Product ${i}`,
        brand: 'Redken',
        price: 1500,
        quantity: 1,
        image: '/img.jpg',
        sku: `SKU-${i}`,
        stockQuantity: 100,
      }))
      useCartStore.setState({ items })

      const ms = measure(() => {
        for (let i = 0; i < ITERATIONS; i++) {
          useCartStore.getState().removeItem(`prod-${i}`)
        }
      })
      expect(ms).toBeLessThan(500)
      expect(useCartStore.getState().items.length).toBe(0)
    })
  })

  describe('Wishlist Store', () => {
    it(`increment: ${ITERATIONS} operations under 100ms`, () => {
      useWishlistStore.setState({ count: 0 })
      const ms = measure(() => {
        for (let i = 0; i < ITERATIONS; i++) {
          useWishlistStore.getState().increment()
        }
      })
      expect(ms).toBeLessThan(100)
      expect(useWishlistStore.getState().count).toBe(ITERATIONS)
    })

    it(`decrement: ${ITERATIONS} operations under 100ms`, () => {
      useWishlistStore.setState({ count: ITERATIONS })
      const ms = measure(() => {
        for (let i = 0; i < ITERATIONS; i++) {
          useWishlistStore.getState().decrement()
        }
      })
      expect(ms).toBeLessThan(100)
      expect(useWishlistStore.getState().count).toBe(0)
    })
  })

  describe('Auth Store', () => {
    it(`setLoading toggle: ${ITERATIONS} operations under 50ms`, () => {
      const ms = measure(() => {
        for (let i = 0; i < ITERATIONS; i++) {
          useAuthStore.getState().setLoading(i % 2 === 0)
        }
      })
      expect(ms).toBeLessThan(50)
    })
  })
})
