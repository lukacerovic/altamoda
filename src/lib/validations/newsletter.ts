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
  emailOptions: z.lazy(() => emailTemplateOptionsSchema).optional(),
})

export const updateCampaignSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  segment: z.enum(['b2b', 'b2c']).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
})

// Strict character classes for email-template options. Each field is interpolated
// raw into HTML/CSS — anything containing quotes, angle brackets, parens, or
// backslashes could break out of its attribute and inject markup.
const safeText = z.string().max(200).regex(/^[^<>'"\\]*$/, 'Nedozvoljeni znakovi')
const safeColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'Boja mora biti hex')
const safeImageUrl = z
  .string()
  .max(2000)
  .regex(/^(https?:\/\/[^<>'"\s]+|\/[^<>'"\s]*)$/, 'URL slike je nevažeći')

export const emailTemplateOptionsSchema = z
  .object({
    headerTitle: safeText.optional(),
    headerSubtitle: safeText.optional(),
    headerBg: safeColor.optional(),
    headerImage: safeImageUrl.optional().or(z.literal('')),
    headerBgImage: safeImageUrl.optional().or(z.literal('')),
    bodyBgImage: safeImageUrl.optional().or(z.literal('')),
    footerText: safeText.optional(),
    footerCopyright: safeText.optional(),
  })
  .strict()

export const testSendSchema = z.object({
  email: z.string().email('Unesite validnu email adresu'),
  subject: z.string().min(1).max(200).optional(),
  html: z.string().max(500_000).optional(),
  options: emailTemplateOptionsSchema.optional(),
})

export type EmailTemplateOptionsInput = z.infer<typeof emailTemplateOptionsSchema>
export type TestSendInput = z.infer<typeof testSendSchema>

export type SubscribeInput = z.infer<typeof subscribeSchema>
export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>
export type NewsletterFilterInput = z.infer<typeof newsletterFilterSchema>
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>
