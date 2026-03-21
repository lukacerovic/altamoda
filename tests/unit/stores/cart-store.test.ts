import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/lib/stores/cart-store'
import { useWishlistStore } from '@/lib/stores/wishlist-store'

describe('Cart Store', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isLoading: false, isHydrated: false })
  })

  const sampleItem = {
    productId: 'prod-1',
    name: 'Test Product',
    brand: 'Test Brand',
    price: 1000,
    quantity: 1,
    image: '/test.jpg',
    sku: 'TST-001',
    stockQuantity: 10,
  }

  describe('addItem', () => {
    it('adds a new item to empty cart', () => {
      useCartStore.getState().addItem(sampleItem)
      const items = useCartStore.getState().items
      expect(items).toHaveLength(1)
      expect(items[0].productId).toBe('prod-1')
      expect(items[0].quantity).toBe(1)
    })

    it('increments quantity when adding existing item', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().addItem({ ...sampleItem, quantity: 3 })
      const items = useCartStore.getState().items
      expect(items).toHaveLength(1)
      expect(items[0].quantity).toBe(4)
    })

    it('adds different products as separate items', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().addItem({ ...sampleItem, productId: 'prod-2', name: 'Product 2' })
      expect(useCartStore.getState().items).toHaveLength(2)
    })

    it('generates an id for new items', () => {
      useCartStore.getState().addItem(sampleItem)
      expect(useCartStore.getState().items[0].id).toBeDefined()
      expect(useCartStore.getState().items[0].id.length).toBeGreaterThan(0)
    })
  })

  describe('updateQuantity', () => {
    it('updates quantity for an existing item', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().updateQuantity('prod-1', 5)
      expect(useCartStore.getState().items[0].quantity).toBe(5)
    })

    it('does not affect other items', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().addItem({ ...sampleItem, productId: 'prod-2', name: 'Product 2' })
      useCartStore.getState().updateQuantity('prod-1', 10)
      expect(useCartStore.getState().items[1].quantity).toBe(1)
    })

    it('ignores update for non-existent productId', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().updateQuantity('non-existent', 5)
      expect(useCartStore.getState().items[0].quantity).toBe(1)
    })
  })

  describe('removeItem', () => {
    it('removes an item by productId', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().removeItem('prod-1')
      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('does not affect other items', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().addItem({ ...sampleItem, productId: 'prod-2' })
      useCartStore.getState().removeItem('prod-1')
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0].productId).toBe('prod-2')
    })
  })

  describe('clearCart', () => {
    it('removes all items', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().addItem({ ...sampleItem, productId: 'prod-2' })
      useCartStore.getState().clearCart()
      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('setItems', () => {
    it('replaces all items', () => {
      useCartStore.getState().addItem(sampleItem)
      useCartStore.getState().setItems([
        { ...sampleItem, id: 'server-1', productId: 'prod-99', quantity: 7 },
      ])
      const items = useCartStore.getState().items
      expect(items).toHaveLength(1)
      expect(items[0].productId).toBe('prod-99')
      expect(items[0].quantity).toBe(7)
    })
  })

  describe('getTotal', () => {
    it('returns 0 for empty cart', () => {
      expect(useCartStore.getState().getTotal()).toBe(0)
    })

    it('calculates correct total', () => {
      useCartStore.getState().addItem({ ...sampleItem, price: 1000, quantity: 2 })
      useCartStore.getState().addItem({ ...sampleItem, productId: 'prod-2', price: 500, quantity: 3 })
      expect(useCartStore.getState().getTotal()).toBe(3500) // 2000 + 1500
    })
  })

  describe('getItemCount', () => {
    it('returns 0 for empty cart', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0)
    })

    it('sums all quantities', () => {
      useCartStore.getState().addItem({ ...sampleItem, quantity: 2 })
      useCartStore.getState().addItem({ ...sampleItem, productId: 'prod-2', quantity: 3 })
      expect(useCartStore.getState().getItemCount()).toBe(5)
    })
  })
})

describe('Wishlist Store', () => {
  beforeEach(() => {
    useWishlistStore.setState({ count: 0 })
  })

  it('starts with count 0', () => {
    expect(useWishlistStore.getState().count).toBe(0)
  })

  it('setCount sets the count', () => {
    useWishlistStore.getState().setCount(5)
    expect(useWishlistStore.getState().count).toBe(5)
  })

  it('increment increases count by 1', () => {
    useWishlistStore.getState().setCount(3)
    useWishlistStore.getState().increment()
    expect(useWishlistStore.getState().count).toBe(4)
  })

  it('decrement decreases count by 1', () => {
    useWishlistStore.getState().setCount(3)
    useWishlistStore.getState().decrement()
    expect(useWishlistStore.getState().count).toBe(2)
  })

  it('decrement does not go below 0', () => {
    useWishlistStore.getState().setCount(0)
    useWishlistStore.getState().decrement()
    expect(useWishlistStore.getState().count).toBe(0)
  })
})
