import { describe, it, expect } from 'vitest'
import * as mockData from '@/data/mocked_data'

describe('Mock Data Integrity', () => {
  it('exports homepage products', () => {
    expect(mockData.tabbedProducts).toBeDefined()
    expect(mockData.bestsellers).toBeDefined()
    expect(Array.isArray(mockData.bestsellers)).toBe(true)
    expect(mockData.bestsellers.length).toBeGreaterThan(0)
  })

  it('exports brands filter', () => {
    expect(mockData.brandsFilter).toBeDefined()
    expect(Array.isArray(mockData.brandsFilter)).toBe(true)
    expect(mockData.brandsFilter.length).toBeGreaterThanOrEqual(5)
  })

  it('exports category tree', () => {
    expect(mockData.categoryTree).toBeDefined()
    expect(Array.isArray(mockData.categoryTree)).toBe(true)
  })

  it('exports FAQ sections', () => {
    expect(mockData.faqSections).toBeDefined()
    expect(Array.isArray(mockData.faqSections)).toBe(true)
    // Each section should have question/answer pairs
    for (const section of mockData.faqSections) {
      expect(section).toHaveProperty('items')
      expect(Array.isArray(section.items)).toBe(true)
    }
  })

  it('exports trust badges', () => {
    expect(mockData.trustBadges).toBeDefined()
    expect(mockData.trustBadges.length).toBe(4)
  })

  it('exports cart items', () => {
    expect(mockData.cartItems).toBeDefined()
    expect(Array.isArray(mockData.cartItems)).toBe(true)
  })

  it('exports wishlist items', () => {
    expect(mockData.wishlistItems).toBeDefined()
    expect(Array.isArray(mockData.wishlistItems)).toBe(true)
  })

  it('exports salon locations', () => {
    expect(mockData.salons).toBeDefined()
    expect(Array.isArray(mockData.salons)).toBe(true)
    expect(mockData.salons.length).toBeGreaterThan(0)
  })

  it('exports admin data structures', () => {
    expect(mockData.adminStatCards).toBeDefined()
    expect(mockData.adminRecentOrders).toBeDefined()
    expect(mockData.adminAllOrders).toBeDefined()
    expect(mockData.adminUsers).toBeDefined()
  })

  it('all products have required fields', () => {
    const products = mockData.productsPageProducts
    expect(products).toBeDefined()
    for (const p of products) {
      expect(p).toHaveProperty('id')
      expect(p).toHaveProperty('name')
      expect(p).toHaveProperty('brand')
      expect(p).toHaveProperty('price')
      expect(p.price).toBeGreaterThan(0)
    }
  })

  it('all admin orders have required fields', () => {
    for (const order of mockData.adminAllOrders) {
      expect(order).toHaveProperty('id')
      expect(order).toHaveProperty('customer')
      expect(order).toHaveProperty('total')
      expect(order).toHaveProperty('status')
    }
  })
})
