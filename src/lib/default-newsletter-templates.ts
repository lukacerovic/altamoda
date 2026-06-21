/**
 * Default newsletter templates — Altamoda letterhead "stationery".
 *
 * The 6 templates are blank letterheads: centred `altamoda` wordmark + tagline,
 * a faint `d` watermark, and a colour scheme. The visual frame (header, footer,
 * watermark, colours) is added by email-preview.ts from each scheme's
 * `EmailTemplateOptions`; this file only supplies the stored body + metadata.
 *
 * Single source of truth for the schemes lives in `newsletter-schemes.ts`.
 */
import { letterheadSchemes } from './newsletter-schemes'

export const defaultTemplates: {
  name: string
  description: string
  subject: string
  htmlContent: string
}[] = letterheadSchemes.map((s) => ({
  name: s.name,
  description: s.description,
  subject: s.subject,
  htmlContent: s.body,
}))
