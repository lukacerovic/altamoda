import { describe, it, expect } from 'vitest'
import { createProductSchema, updateProductSchema, productFilterSchema } from '@/lib/validations/product'

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

    it('accepts ERP fields (barcode, vatRate, vatCode, erpId)', () => {
      const result = createProductSchema.parse({
        ...validProduct,
        barcode: '3474630715530',
        vatRate: 20,
        vatCode: 'R2',
        erpId: '10002',
      })
      expect(result.barcode).toBe('3474630715530')
      expect(result.vatRate).toBe(20)
      expect(result.vatCode).toBe('R2')
      expect(result.erpId).toBe('10002')
    })

    it('defaults vatRate to 20', () => {
      const result = createProductSchema.parse(validProduct)
      expect(result.vatRate).toBe(20)
    })

    it('accepts 10% VAT rate', () => {
      const result = createProductSchema.parse({ ...validProduct, vatRate: 10 })
      expect(result.vatRate).toBe(10)
    })

    it('rejects vatRate over 100', () => {
      expect(() => createProductSchema.parse({ ...validProduct, vatRate: 101 })).toThrow()
    })

    it('rejects negative vatRate', () => {
      expect(() => createProductSchema.parse({ ...validProduct, vatRate: -1 })).toThrow()
    })

    it('coerces string vatRate to number', () => {
      const result = createProductSchema.parse({ ...validProduct, vatRate: '20' })
      expect(result.vatRate).toBe(20)
    })

    it('accepts costPrice', () => {
      const result = createProductSchema.parse({ ...validProduct, costPrice: 800 })
      expect(result.costPrice).toBe(800)
    })

    it('ERP fields are optional', () => {
      const result = createProductSchema.parse(validProduct)
      expect(result.barcode).toBeUndefined()
      expect(result.vatCode).toBeUndefined()
      expect(result.erpId).toBeUndefined()
    })
  })

  describe('updateProductSchema', () => {
    it('accepts all ERP fields as optional', () => {
      const result = updateProductSchema.parse({
        barcode: '1234567890123',
        vatRate: 10,
        vatCode: 'R1',
        erpId: '5000',
      })
      expect(result.barcode).toBe('1234567890123')
      expect(result.vatRate).toBe(10)
      expect(result.vatCode).toBe('R1')
      expect(result.erpId).toBe('5000')
    })

    it('accepts empty update (all optional)', () => {
      const result = updateProductSchema.parse({})
      expect(result).toBeDefined()
    })

    it('rejects invalid vatRate in update', () => {
      expect(() => updateProductSchema.parse({ vatRate: 150 })).toThrow()
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
