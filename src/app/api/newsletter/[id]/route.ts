import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

// DELETE /api/newsletter/[id] — delete subscriber (admin only)
export const DELETE = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()

  const { id } = (context as { params: Promise<{ id: string }> }).params
    ? await (context as { params: Promise<{ id: string }> }).params
    : (context as { params: { id: string } }).params

  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } })

  if (!subscriber) {
    throw new ApiError(404, 'Pretplatnik nije pronađen')
  }

  await prisma.newsletterSubscriber.delete({ where: { id } })

  return successResponse({ message: 'Pretplatnik je obrisan' })
})
