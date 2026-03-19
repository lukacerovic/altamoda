import { z } from 'zod'

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.coerce.number().int().min(1),
    })
  ).min(1),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('Srbija'),
  }),
  billingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('Srbija'),
  }).optional(),
  paymentMethod: z.enum(['card', 'bank_transfer', 'cash_on_delivery', 'invoice']),
  shippingMethod: z.string().optional(),
  promoCode: z.string().optional(),
  notes: z.string().optional(),
})

export const updateStatusSchema = z.object({
  status: z.enum(['novi', 'u_obradi', 'isporuceno', 'otkazano']),
  note: z.string().optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>
