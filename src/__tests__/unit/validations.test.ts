import { describe, it, expect } from 'vitest'
import { loginSchema, registerB2cSchema, registerB2bSchema } from '@/lib/validations/user'
import { createProductSchema, productFilterSchema } from '@/lib/validations/product'
import { createOrderSchema, updateStatusSchema } from '@/lib/validations/order'
import { paginationSchema, idSchema } from '@/lib/validations/common'

// ─── User Validations ───

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com', password: 'abc123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'abc123' })
    expect(result.success).toBe(false)
  })

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'abc123' })
    expect(result.success).toBe(false)
  })

  it('rejects short password (less than 6 chars)', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com', password: '12345' })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    expect(loginSchema.safeParse({}).success).toBe(false)
    expect(loginSchema.safeParse({ email: 'test@test.com' }).success).toBe(false)
    expect(loginSchema.safeParse({ password: 'abc123' }).success).toBe(false)
  })
})

describe('registerB2cSchema', () => {
  const validB2c = {
    name: 'Marija Petrovic',
    email: 'marija@test.com',
    password: 'test123',
  }

  it('accepts valid B2C registration', () => {
    expect(registerB2cSchema.safeParse(validB2c).success).toBe(true)
  })

  it('accepts with optional phone', () => {
    expect(registerB2cSchema.safeParse({ ...validB2c, phone: '+381631234567' }).success).toBe(true)
  })

  it('rejects short name', () => {
    expect(registerB2cSchema.safeParse({ ...validB2c, name: 'A' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(registerB2cSchema.safeParse({ ...validB2c, email: 'bad' }).success).toBe(false)
  })

  it('rejects short password', () => {
    expect(registerB2cSchema.safeParse({ ...validB2c, password: '123' }).success).toBe(false)
  })
})

describe('registerB2bSchema', () => {
  const validB2b = {
    name: 'Salon Glamour',
    email: 'salon@test.com',
    password: 'test123',
    salonName: 'Salon Glamour',
    pib: '123456789',
    maticniBroj: '12345678',
  }

  it('accepts valid B2B registration', () => {
    expect(registerB2bSchema.safeParse(validB2b).success).toBe(true)
  })

  it('accepts with optional address', () => {
    expect(registerB2bSchema.safeParse({ ...validB2b, address: 'Knez Mihailova 15' }).success).toBe(true)
  })

  it('rejects missing salon name', () => {
    const { salonName, ...rest } = validB2b
    expect(registerB2bSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects invalid PIB (not 9 digits)', () => {
    expect(registerB2bSchema.safeParse({ ...validB2b, pib: '12345' }).success).toBe(false)
    expect(registerB2bSchema.safeParse({ ...validB2b, pib: '1234567890' }).success).toBe(false)
  })

  it('rejects invalid maticni broj (not 8 digits)', () => {
    expect(registerB2bSchema.safeParse({ ...validB2b, maticniBroj: '1234' }).success).toBe(false)
    expect(registerB2bSchema.safeParse({ ...validB2b, maticniBroj: '123456789' }).success).toBe(false)
  })
})

// ─── Product Validations ───

describe('createProductSchema', () => {
  const validProduct = {
    sku: 'LOR-MD-300',
    nameLat: 'Metal Detox Šampon 300ml',
    priceB2c: 2400,
  }

  it('accepts valid product with required fields', () => {
    expect(createProductSchema.safeParse(validProduct).success).toBe(true)
  })

  it('accepts full product data', () => {
    const full = {
      ...validProduct,
      nameCyr: 'Метал Детокс Шампон',
      brandId: 'brand123',
      categoryId: 'cat123',
      description: 'Great shampoo',
      priceB2b: 1920,
      oldPrice: 3000,
      stockQuantity: 50,
      isProfessional: true,
      isNew: true,
      isFeatured: false,
    }
    expect(createProductSchema.safeParse(full).success).toBe(true)
  })

  it('rejects empty SKU', () => {
    expect(createProductSchema.safeParse({ ...validProduct, sku: '' }).success).toBe(false)
  })

  it('rejects negative price', () => {
    expect(createProductSchema.safeParse({ ...validProduct, priceB2c: -100 }).success).toBe(false)
  })

  it('rejects zero price', () => {
    expect(createProductSchema.safeParse({ ...validProduct, priceB2c: 0 }).success).toBe(false)
  })

  it('coerces string numbers to numbers', () => {
    const result = createProductSchema.safeParse({ ...validProduct, priceB2c: '2400' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.priceB2c).toBe('number')
    }
  })
})

describe('productFilterSchema', () => {
  it('accepts empty filter (all defaults)', () => {
    const result = productFilterSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sort).toBe('popular')
    }
  })

  it('accepts valid filter combination', () => {
    const result = productFilterSchema.safeParse({
      category: 'samponi',
      brand: ['loreal', 'schwarzkopf'],
      priceMin: 500,
      priceMax: 5000,
      search: 'šampon',
      sort: 'price_asc',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid sort option', () => {
    const result = productFilterSchema.safeParse({ sort: 'invalid_sort' })
    expect(result.success).toBe(false)
  })
})

// ─── Order Validations ───

describe('createOrderSchema', () => {
  const validOrder = {
    items: [{ productId: 'prod1', quantity: 2 }],
    shippingAddress: {
      street: 'Knez Mihailova 15',
      city: 'Beograd',
      postalCode: '11000',
    },
    paymentMethod: 'card',
  }

  it('accepts valid order', () => {
    expect(createOrderSchema.safeParse(validOrder).success).toBe(true)
  })

  it('rejects empty items array', () => {
    expect(createOrderSchema.safeParse({ ...validOrder, items: [] }).success).toBe(false)
  })

  it('rejects zero quantity', () => {
    const order = { ...validOrder, items: [{ productId: 'prod1', quantity: 0 }] }
    expect(createOrderSchema.safeParse(order).success).toBe(false)
  })

  it('rejects missing shipping address fields', () => {
    const order = { ...validOrder, shippingAddress: { street: 'Test' } }
    expect(createOrderSchema.safeParse(order).success).toBe(false)
  })

  it('accepts invoice payment (B2B)', () => {
    const order = { ...validOrder, paymentMethod: 'invoice' }
    expect(createOrderSchema.safeParse(order).success).toBe(true)
  })

  it('rejects invalid payment method', () => {
    const order = { ...validOrder, paymentMethod: 'bitcoin' }
    expect(createOrderSchema.safeParse(order).success).toBe(false)
  })

  it('accepts optional promo code and notes', () => {
    const order = { ...validOrder, promoCode: 'POPUST10', notes: 'Hitna dostava' }
    expect(createOrderSchema.safeParse(order).success).toBe(true)
  })
})

describe('updateStatusSchema', () => {
  it('accepts valid status', () => {
    expect(updateStatusSchema.safeParse({ status: 'novi' }).success).toBe(true)
    expect(updateStatusSchema.safeParse({ status: 'u_obradi' }).success).toBe(true)
    expect(updateStatusSchema.safeParse({ status: 'isporuceno' }).success).toBe(true)
    expect(updateStatusSchema.safeParse({ status: 'otkazano' }).success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(updateStatusSchema.safeParse({ status: 'shipped' }).success).toBe(false)
    expect(updateStatusSchema.safeParse({ status: '' }).success).toBe(false)
  })

  it('accepts optional note', () => {
    expect(updateStatusSchema.safeParse({ status: 'u_obradi', note: 'U pripremi' }).success).toBe(true)
  })
})

// ─── Common Validations ───

describe('paginationSchema', () => {
  it('uses defaults for empty input', () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(12)
    }
  })

  it('rejects page less than 1', () => {
    expect(paginationSchema.safeParse({ page: 0 }).success).toBe(false)
    expect(paginationSchema.safeParse({ page: -1 }).success).toBe(false)
  })

  it('rejects limit over 100', () => {
    expect(paginationSchema.safeParse({ limit: 101 }).success).toBe(false)
  })

  it('coerces string numbers', () => {
    const result = paginationSchema.safeParse({ page: '3', limit: '20' })
    expect(result.success).toBe(true)
  })
})

describe('idSchema', () => {
  it('accepts valid id', () => {
    expect(idSchema.safeParse({ id: 'clx123abc' }).success).toBe(true)
  })

  it('rejects empty id', () => {
    expect(idSchema.safeParse({ id: '' }).success).toBe(false)
  })
})
