import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { defaultTemplates } from '@/lib/default-newsletter-templates'

// POST /api/newsletter/templates/seed — seed default templates if none exist
export const POST = withErrorHandler(async () => {
  await requireAdmin()

  const existingDefaults = await prisma.newsletterTemplate.count({
    where: { isDefault: true },
  })

  if (existingDefaults > 0) {
    return successResponse({ message: 'Podrazumevani šabloni već postoje', seeded: 0 })
  }

  const created = await prisma.newsletterTemplate.createMany({
    data: defaultTemplates.map((t) => ({
      name: t.name,
      description: t.description,
      subject: t.subject,
      htmlContent: t.htmlContent,
      isDefault: true,
    })),
  })

  return successResponse({ message: 'Podrazumevani šabloni su kreirani', seeded: created.count })
})
