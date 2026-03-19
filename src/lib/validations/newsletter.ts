import { z } from 'zod'
import { paginationSchema } from './common'

export const subscribeSchema = z.object({
  email: z.string().email('Unesite validnu email adresu'),
  segment: z.enum(['b2b', 'b2c']).optional().default('b2c'),
})

export const unsubscribeSchema = z.object({
  email: z.string().email('Unesite validnu email adresu'),
})

export const newsletterFilterSchema = z
  .object({
    search: z.string().optional().default(''),
    segment: z.enum(['all', 'b2b', 'b2c']).optional().default('all'),
  })
  .merge(paginationSchema)

export type SubscribeInput = z.infer<typeof subscribeSchema>
export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>
export type NewsletterFilterInput = z.infer<typeof newsletterFilterSchema>
