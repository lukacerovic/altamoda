import { describe, it, expect } from 'vitest'
import { createOrderSchema, updateStatusSchema } from '@/lib/validations/order'

describe('Order Validations', () => {
  const validOrder = {
    items: [{ productId: 'prod-1', quantity: 2 }],
    shippingAddress: {
      street: 'Knez Mihailova 10',
      city: 'Beograd',
      postalCode: '11000',
    },
    paymentMethod: 'card' as const,
  }

  describe('createOrderSchema', () => {
    it('accepts a valid order with minimal fields', () => {
      const result = createOrderSchema.parse(validOrder)
      expect(result.items).toHaveLength(1)
      expect(result.shippingAddress.country).toBe('Srbija') // default
      expect(result.paymentMethod).toBe('card')
    })

    it('accepts order with all payment methods', () => {
      const methods = ['card', 'bank_transfer', 'cash_on_delivery', 'invoice'] as const
      for (const method of methods) {
        const result = createOrderSchema.parse({ ...validOrder, paymentMethod: method })
        expect(result.paymentMethod).toBe(method)
      }
    })

    it('accepts order with optional billing address', () => {
      const result = createOrderSchema.parse({
        ...validOrder,
        billingAddress: {
          street: 'Terazije 5',
          city: 'Beograd',
          postalCode: '11000',
        },
      })
      expect(result.billingAddress?.city).toBe('Beograd')
    })

    it('accepts order with optional notes and promo code', () => {
      const result = createOrderSchema.parse({
        ...validOrder,
        notes: 'Dostaviti pre podne',
        promoCode: 'POPUST10',
      })
      expect(result.notes).toBe('Dostaviti pre podne')
      expect(result.promoCode).toBe('POPUST10')
    })

    it('rejects empty items array', () => {
      expect(() => createOrderSchema.parse({ ...validOrder, items: [] })).toThrow()
    })

    it('rejects items with quantity 0', () => {
      expect(() =>
        createOrderSchema.parse({
          ...validOrder,
          items: [{ productId: 'prod-1', quantity: 0 }],
        })
      ).toThrow()
    })

    it('rejects invalid payment method', () => {
      expect(() =>
        createOrderSchema.parse({ ...validOrder, paymentMethod: 'crypto' })
      ).toThrow()
    })

    it('rejects missing shipping address fields', () => {
      expect(() =>
        createOrderSchema.parse({
          ...validOrder,
          shippingAddress: { street: '', city: 'Beograd', postalCode: '11000' },
        })
      ).toThrow()
    })

    it('accepts multiple items', () => {
      const result = createOrderSchema.parse({
        ...validOrder,
        items: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 5 },
          { productId: 'prod-3', quantity: 1 },
        ],
      })
      expect(result.items).toHaveLength(3)
    })

    it('coerces string quantity to number', () => {
      const result = createOrderSchema.parse({
        ...validOrder,
        items: [{ productId: 'prod-1', quantity: '3' }],
      })
      expect(result.items[0].quantity).toBe(3)
    })
  })

  describe('updateStatusSchema', () => {
    it('accepts all valid statuses', () => {
      const statuses = ['novi', 'u_obradi', 'isporuceno', 'otkazano'] as const
      for (const status of statuses) {
        const result = updateStatusSchema.parse({ status })
        expect(result.status).toBe(status)
      }
    })

    it('accepts status with optional note', () => {
      const result = updateStatusSchema.parse({
        status: 'u_obradi',
        note: 'Narudžbina u pripremi',
      })
      expect(result.note).toBe('Narudžbina u pripremi')
    })

    it('rejects invalid status', () => {
      expect(() => updateStatusSchema.parse({ status: 'shipped' })).toThrow()
    })

    it('rejects missing status', () => {
      expect(() => updateStatusSchema.parse({})).toThrow()
    })
  })
})
