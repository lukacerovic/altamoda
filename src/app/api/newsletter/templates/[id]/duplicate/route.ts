import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// POST /api/newsletter/templates/[id]/duplicate — duplicate template (admin only)
export const POST = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()

  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const template = await prisma.newsletterTemplate.findUnique({ where: { id } })

  if (!template) {
    throw new ApiError(404, 'Šablon nije pronađen')
  }

  const duplicate = await prisma.newsletterTemplate.create({
    data: {
      name: `${template.name} (kopija)`,
      subject: template.subject,
      htmlContent: template.htmlContent,
      description: template.description,
      thumbnail: template.thumbnail,
      isDefault: false,
    },
  })

  return successResponse(duplicate, 201)
})
