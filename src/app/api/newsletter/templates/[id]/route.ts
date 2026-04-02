import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// GET /api/newsletter/templates/[id] — get single template (admin only)
export const GET = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()

  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const template = await prisma.newsletterTemplate.findUnique({ where: { id } })

  if (!template) {
    throw new ApiError(404, 'Šablon nije pronađen')
  }

  return successResponse(template)
})

// PUT /api/newsletter/templates/[id] — update template (admin only)
export const PUT = withErrorHandler(async (req: Request, context: unknown) => {
  await requireAdmin()

  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const template = await prisma.newsletterTemplate.findUnique({ where: { id } })

  if (!template) {
    throw new ApiError(404, 'Šablon nije pronađen')
  }

  const body = await req.json()

  const updated = await prisma.newsletterTemplate.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      subject: body.subject ?? undefined,
      htmlContent: body.htmlContent ?? undefined,
      description: body.description !== undefined ? body.description : undefined,
      thumbnail: body.thumbnail !== undefined ? body.thumbnail : undefined,
      isDefault: body.isDefault !== undefined ? body.isDefault : undefined,
    },
  })

  return successResponse(updated)
})

// DELETE /api/newsletter/templates/[id] — delete template (admin only, not default)
export const DELETE = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()

  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const template = await prisma.newsletterTemplate.findUnique({ where: { id } })

  if (!template) {
    throw new ApiError(404, 'Šablon nije pronađen')
  }

  if (template.isDefault) {
    throw new ApiError(400, 'Podrazumevani šabloni ne mogu biti obrisani')
  }

  await prisma.newsletterTemplate.delete({ where: { id } })

  return successResponse({ message: 'Šablon je obrisan' })
})
