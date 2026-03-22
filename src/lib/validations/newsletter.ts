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

export const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().min(1).max(200),
  content: z.string().min(1),
  segment: z.enum(['b2b', 'b2c']).optional().default('b2c'),
})

export const updateCampaignSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  segment: z.enum(['b2b', 'b2c']).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
})

export type SubscribeInput = z.infer<typeof subscribeSchema>
export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>
export type NewsletterFilterInput = z.infer<typeof newsletterFilterSchema>
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
