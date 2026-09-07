import { z } from 'zod'
import { isAcceptableStreet, isAcceptableCity, isAcceptablePostalCode } from '@/lib/validation/address'

/** Mirror of the checkout form's field rules, but with looser bounds so
 *  addresses customers already have saved (including foreign ones) still pass.
 *  The client filters input as it is typed; this is the non-bypassable copy. */
const addressSchema = z.object({
  street: z.string().min(1).max(120).refine(isAcceptableStreet, 'invalid street'),
  city: z.string().min(1).max(60).refine(isAcceptableCity, 'invalid city'),
  postalCode: z.string().min(1).max(10).refine(isAcceptablePostalCode, 'invalid postal code'),
  country: z.string().default('Srbija'),
})

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.coerce.number().int().min(1),
    })
  ).min(1),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(['card', 'bank_transfer', 'cash_on_delivery', 'invoice']),
  shippingMethod: z.string().optional(),
  notes: z.string().optional(),
  guestName: z.string().min(1).optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().min(5).optional(),
})

export const updateStatusSchema = z.object({
  status: z.enum(['novi', 'u_obradi', 'isporuceno', 'otkazano']),
  note: z.string().optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>
