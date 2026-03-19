import { z } from 'zod'

export const createProductSchema = z.object({
  sku: z.string().min(1),
  nameLat: z.string().min(1),
  nameCyr: z.string().optional(),
  brandId: z.string().optional(),
  productLineId: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  ingredients: z.string().optional(),
  usageInstructions: z.string().optional(),
  priceB2c: z.coerce.number().positive(),
  priceB2b: z.coerce.number().positive().optional(),
  oldPrice: z.coerce.number().positive().optional(),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  isProfessional: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
})

export const productFilterSchema = z.object({
  category: z.string().optional(),
  brand: z.union([z.string(), z.array(z.string())]).optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  search: z.string().optional(),
  sort: z.enum(['popular', 'price_asc', 'price_desc', 'newest', 'rating']).default('popular'),
  isProfessional: z.coerce.boolean().optional(),
  isNew: z.coerce.boolean().optional(),
  onSale: z.coerce.boolean().optional(),
})
