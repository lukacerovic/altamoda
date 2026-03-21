import { describe, it, expect } from 'vitest'
import { loginSchema, registerB2bSchema } from '@/lib/validations/user'
import { createProductSchema, productFilterSchema } from '@/lib/validations/product'
import { addToCartSchema } from '@/lib/validations/cart'
import { createOrderSchema } from '@/lib/validations/order'
import { subscribeSchema } from '@/lib/validations/newsletter'

/**
 * Performance tests — measure Zod validation throughput.
 * Ensures schema validation stays fast under high volume.
 */

const ITERATIONS = 5_000

function measure(fn: () => void): number {
  const start = performance.now()
  fn()
  return performance.now() - start
}

describe('Performance — Zod Validation Schemas', () => {
  it(`loginSchema: ${ITERATIONS} validations under 200ms`, () => {
    const ms = measure(() => {
      for (let i = 0; i < ITERATIONS; i++) {
        loginSchema.parse({ email: `user${i}@test.com`, password: 'password123' })
      }
    })
    expect(ms).toBeLessThan(200)
  })

  it(`registerB2bSchema: ${ITERATIONS} validations under 300ms`, () => {
    const ms = measure(() => {
      for (let i = 0; i < ITERATIONS; i++) {
        registerB2bSchema.parse({
          name: 'Salon Owner',
          email: `salon${i}@test.rs`,
          password: 'sifra123',
          salonName: 'Salon Lepota',
          pib: '123456789',
          maticniBroj: '12345678',
        })
      }
    })
    expect(ms).toBeLessThan(300)
  })

  it(`addToCartSchema: ${ITERATIONS} validations under 150ms`, () => {
    const ms = measure(() => {
      for (let i = 0; i < ITERATIONS; i++) {
        addToCartSchema.parse({ productId: `prod-${i}`, quantity: (i % 99) + 1 })
      }
    })
    expect(ms).toBeLessThan(150)
  })

  it(`createProductSchema: ${ITERATIONS} validations under 300ms`, () => {
    const ms = measure(() => {
      for (let i = 0; i < ITERATIONS; i++) {
        createProductSchema.parse({
          sku: `SKU-${i}`,
          nameLat: `Product ${i}`,
          priceB2c: 1000 + i,
        })
      }
    })
    expect(ms).toBeLessThan(300)
  })

  it(`productFilterSchema: ${ITERATIONS} validations under 200ms`, () => {
    const ms = measure(() => {
      for (let i = 0; i < ITERATIONS; i++) {
        productFilterSchema.parse({
          category: 'shampoos',
          brand: 'Redken',
          priceMin: 500,
          priceMax: 5000,
          search: 'moisturizing',
          sort: 'price_asc',
        })
      }
    })
    expect(ms).toBeLessThan(200)
  })

  it(`createOrderSchema: ${ITERATIONS} validations under 500ms`, () => {
    const ms = measure(() => {
      for (let i = 0; i < ITERATIONS; i++) {
        createOrderSchema.parse({
          items: [
            { productId: `prod-${i}`, quantity: 2 },
            { productId: `prod-${i + 1}`, quantity: 1 },
          ],
          shippingAddress: {
            street: 'Knez Mihailova 10',
            city: 'Beograd',
            postalCode: '11000',
          },
          paymentMethod: 'card',
        })
      }
    })
    expect(ms).toBeLessThan(500)
  })

  it(`subscribeSchema: ${ITERATIONS} validations under 150ms`, () => {
    const ms = measure(() => {
      for (let i = 0; i < ITERATIONS; i++) {
        subscribeSchema.parse({ email: `user${i}@newsletter.rs`, segment: i % 2 === 0 ? 'b2c' : 'b2b' })
      }
    })
    expect(ms).toBeLessThan(150)
  })
})
