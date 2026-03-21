import { describe, it, expect } from 'vitest'
import { createProductSchema, productFilterSchema } from '@/lib/validations/product'

describe('Product Validations', () => {
  describe('createProductSchema', () => {
    const validProduct = {
      sku: 'RED-SH-001',
      nameLat: 'Redken All Soft Shampoo',
      priceB2c: 1500,
    }

    it('accepts valid product with minimal fields', () => {
      const result = createProductSchema.parse(validProduct)
      expect(result.sku).toBe('RED-SH-001')
      expect(result.nameLat).toBe('Redken All Soft Shampoo')
      expect(result.priceB2c).toBe(1500)
      expect(result.stockQuantity).toBe(0) // default
      expect(result.isProfessional).toBe(false) // default
      expect(result.isNew).toBe(false)
      expect(result.isFeatured).toBe(false)
    })

    it('accepts product with all optional fields', () => {
      const result = createProductSchema.parse({
        ...validProduct,
        nameCyr: 'Редкен Ол Софт Шампон',
        brandId: 'brand-1',
        productLineId: 'line-1',
        categoryId: 'cat-1',
        description: 'Moisturizing shampoo',
        ingredients: 'Water, Sodium Laureth Sulfate',
        usageInstructions: 'Apply to wet hair',
        priceB2b: 1200,
        oldPrice: 1800,
        stockQuantity: 50,
        isProfessional: true,
        isNew: true,
        isFeatured: true,
      })
      expect(result.isProfessional).toBe(true)
      expect(result.priceB2b).toBe(1200)
      expect(result.stockQuantity).toBe(50)
    })

    it('rejects empty SKU', () => {
      expect(() => createProductSchema.parse({ ...validProduct, sku: '' })).toThrow()
    })

    it('rejects empty name', () => {
      expect(() => createProductSchema.parse({ ...validProduct, nameLat: '' })).toThrow()
    })

    it('rejects negative price', () => {
      expect(() => createProductSchema.parse({ ...validProduct, priceB2c: -100 })).toThrow()
    })

    it('rejects zero price', () => {
      expect(() => createProductSchema.parse({ ...validProduct, priceB2c: 0 })).toThrow()
    })

    it('rejects negative stock quantity', () => {
      expect(() => createProductSchema.parse({ ...validProduct, stockQuantity: -1 })).toThrow()
    })

    it('coerces string prices to numbers', () => {
      const result = createProductSchema.parse({ ...validProduct, priceB2c: '2500' })
      expect(result.priceB2c).toBe(2500)
    })
  })

  describe('productFilterSchema', () => {
    it('provides sensible defaults', () => {
      const result = productFilterSchema.parse({})
      expect(result.sort).toBe('popular')
    })

    it('accepts all sort options', () => {
      const sorts = ['popular', 'price_asc', 'price_desc', 'newest', 'rating'] as const
      for (const sort of sorts) {
        const result = productFilterSchema.parse({ sort })
        expect(result.sort).toBe(sort)
      }
    })

    it('accepts category and brand filters', () => {
      const result = productFilterSchema.parse({
        category: 'shampoos',
        brand: 'Redken',
      })
      expect(result.category).toBe('shampoos')
      expect(result.brand).toBe('Redken')
    })

    it('accepts brand as array', () => {
      const result = productFilterSchema.parse({
        brand: ['Redken', 'Matrix'],
      })
      expect(result.brand).toEqual(['Redken', 'Matrix'])
    })

    it('accepts price range filter', () => {
      const result = productFilterSchema.parse({ priceMin: 500, priceMax: 3000 })
      expect(result.priceMin).toBe(500)
      expect(result.priceMax).toBe(3000)
    })

    it('accepts search text', () => {
      const result = productFilterSchema.parse({ search: 'shampoo moisturizing' })
      expect(result.search).toBe('shampoo moisturizing')
    })

    it('accepts boolean flags', () => {
      const result = productFilterSchema.parse({
        isProfessional: true,
        isNew: true,
        onSale: true,
      })
      expect(result.isProfessional).toBe(true)
      expect(result.isNew).toBe(true)
      expect(result.onSale).toBe(true)
    })

    it('rejects invalid sort option', () => {
      expect(() => productFilterSchema.parse({ sort: 'alphabetical' })).toThrow()
    })
  })
})
