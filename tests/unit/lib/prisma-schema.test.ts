import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma')
const schema = fs.readFileSync(schemaPath, 'utf-8')

describe('Prisma Schema Integrity', () => {
  it('schema file exists', () => {
    expect(fs.existsSync(schemaPath)).toBe(true)
  })

  it('has PostgreSQL provider', () => {
    expect(schema).toContain('provider = "postgresql"')
  })

  // ─── Required Tables ───

  const requiredModels = [
    'User', 'UserAddress', 'B2bProfile',
    'Brand', 'ProductLine', 'Category', 'Product', 'ProductImage', 'ColorProduct',
    'DynamicAttribute', 'DynamicAttributeOption', 'ProductAttribute',
    'Cart', 'CartItem', 'Wishlist',
    'Order', 'OrderItem', 'OrderStatusHistory',
    'Review',
    'Promotion', 'PromoCode',
    'Bundle', 'BundleItem',
    'Banner',
    'NewsletterSubscriber',
    'ShippingZone', 'ShippingRate',
    'ErpSyncLog', 'ErpSyncQueue', 'SeoMetadata', 'Faq',
  ]

  for (const model of requiredModels) {
    it(`has model ${model}`, () => {
      expect(schema).toContain(`model ${model}`)
    })
  }

  // ─── Required Enums ───

  const requiredEnums = [
    'UserRole', 'UserStatus', 'OrderStatus', 'PaymentMethod',
    'PaymentStatus', 'PromoType', 'Audience', 'AttributeType',
    'MediaType', 'ShippingMethod',
  ]

  for (const enumName of requiredEnums) {
    it(`has enum ${enumName}`, () => {
      expect(schema).toContain(`enum ${enumName}`)
    })
  }

  // ─── Key Constraints ───

  it('User email is unique', () => {
    expect(schema).toMatch(/model User[\s\S]*?email\s+String\s+@unique/)
  })

  it('Product SKU is unique', () => {
    expect(schema).toMatch(/model Product[\s\S]*?sku\s+String\s+@unique/)
  })

  it('PromoCode code is unique', () => {
    expect(schema).toMatch(/model PromoCode[\s\S]*?code\s+String\s+@unique/)
  })

  it('Review has unique constraint per user per product', () => {
    expect(schema).toContain('@@unique([productId, userId])')
  })

  it('Wishlist has unique constraint per user per product', () => {
    expect(schema).toContain('@@unique([userId, productId])')
  })

  // ─── Table Mappings ───

  it('uses snake_case table names', () => {
    expect(schema).toContain('@@map("users")')
    expect(schema).toContain('@@map("products")')
    expect(schema).toContain('@@map("orders")')
    expect(schema).toContain('@@map("order_items")')
    expect(schema).toContain('@@map("b2b_profiles")')
    expect(schema).toContain('@@map("product_images")')
  })

  // ─── No Blog/Seminar Tables ───

  it('does NOT have blog_posts model', () => {
    expect(schema).not.toContain('model BlogPost')
    expect(schema).not.toContain('blog_posts')
  })

  it('does NOT have seminars model', () => {
    expect(schema).not.toContain('model Seminar')
    expect(schema).not.toContain('seminar_registrations')
  })

  // ─── Field Types ───

  it('uses Decimal for prices', () => {
    expect(schema).toContain('@db.Decimal(10, 2)')
  })

  it('has cascade deletes on child relations', () => {
    expect(schema).toContain('onDelete: Cascade')
  })

  it('Product has both B2C and B2B prices', () => {
    expect(schema).toContain('priceB2c')
    expect(schema).toContain('priceB2b')
  })

  it('Product has professional flag for B2B visibility', () => {
    expect(schema).toContain('isProfessional')
  })

  // ─── Pantheon ERP Alignment Fields ───

  it('Product has ERP sync fields', () => {
    expect(schema).toMatch(/model Product[\s\S]*?erpId/)
    expect(schema).toMatch(/model Product[\s\S]*?barcode/)
    expect(schema).toMatch(/model Product[\s\S]*?vatRate/)
    expect(schema).toMatch(/model Product[\s\S]*?vatCode/)
  })

  it('Product vatRate defaults to 20', () => {
    expect(schema).toContain('@default(20)')
  })

  it('Order has ERP sync tracking fields', () => {
    expect(schema).toMatch(/model Order[\s\S]*?erpSynced/)
    expect(schema).toMatch(/model Order[\s\S]*?erpId/)
  })

  it('B2bProfile has erpSubjectId for Pantheon customer link', () => {
    expect(schema).toMatch(/model B2bProfile[\s\S]*?erpSubjectId/)
  })

  it('B2bProfile erpSubjectId is unique', () => {
    expect(schema).toContain('"erp_subject_id"')
  })

  it('ErpSyncQueue has retry tracking fields', () => {
    expect(schema).toMatch(/model ErpSyncQueue[\s\S]*?attempts/)
    expect(schema).toMatch(/model ErpSyncQueue[\s\S]*?maxAttempts/)
    expect(schema).toMatch(/model ErpSyncQueue[\s\S]*?lastError/)
    expect(schema).toMatch(/model ErpSyncQueue[\s\S]*?nextRetryAt/)
  })

  it('ErpSyncQueue maps to snake_case table', () => {
    expect(schema).toContain('@@map("erp_sync_queue")')
  })

  it('ErpSyncQueue has index on status and nextRetryAt', () => {
    expect(schema).toContain('@@index([status, nextRetryAt])')
  })

  it('ErpSyncLog has SyncDirection and SyncStatus enums', () => {
    expect(schema).toContain('enum SyncDirection')
    expect(schema).toContain('enum SyncStatus')
  })
})
