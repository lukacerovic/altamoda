import { z } from 'zod'

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(999),
})

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(999),
})

export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
