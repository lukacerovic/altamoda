import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// GET /api/newsletter/templates — list all templates (admin only)
export const GET = withErrorHandler(async () => {
  await requireAdmin()

  const templates = await prisma.newsletterTemplate.findMany({
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  return successResponse(templates)
})

// POST /api/newsletter/templates — create template (admin only)
export const POST = withErrorHandler(async (req: Request) => {
  await requireAdmin()

  const body = await req.json()

  const { name, subject, htmlContent, description, thumbnail, isDefault } = body

  if (!name || !subject || !htmlContent) {
    throw new ApiError(400, 'Polja name, subject i htmlContent su obavezna')
  }

  const template = await prisma.newsletterTemplate.create({
    data: {
      name,
      subject,
      htmlContent,
      description: description || null,
      thumbnail: thumbnail || null,
      isDefault: isDefault ?? false,
    },
  })

  return successResponse(template, 201)
})
