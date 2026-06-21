import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { defaultTemplates } from '@/lib/default-newsletter-templates'

// POST /api/newsletter/templates/seed — seed or update default templates
export const POST = withErrorHandler(async () => {
  await requireAdmin()

  let created = 0
  let updated = 0

  // Prune stale default templates (e.g. the old Akcije/Novo/Info) so re-seeding
  // converges on exactly the current set. Campaigns that referenced them keep
  // their copied content — the FK is optional and nulls on delete.
  const keepNames = defaultTemplates.map((t) => t.name)
  const pruned = await prisma.newsletterTemplate.deleteMany({
    where: { isDefault: true, name: { notIn: keepNames } },
  })

  for (const t of defaultTemplates) {
    const existing = await prisma.newsletterTemplate.findFirst({
      where: { name: t.name, isDefault: true },
    })

    if (existing) {
      await prisma.newsletterTemplate.update({
        where: { id: existing.id },
        data: {
          description: t.description,
          subject: t.subject,
          htmlContent: t.htmlContent,
        },
      })
      updated++
    } else {
      await prisma.newsletterTemplate.create({
        data: {
          name: t.name,
          description: t.description,
          subject: t.subject,
          htmlContent: t.htmlContent,
          isDefault: true,
        },
      })
      created++
    }
  }

  return successResponse({
    message: `Šabloni ažurirani: ${created} kreirano, ${updated} ažurirano, ${pruned.count} uklonjeno`,
    created,
    updated,
    pruned: pruned.count,
  })
})
