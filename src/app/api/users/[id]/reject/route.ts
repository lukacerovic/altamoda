import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { getRouteParams } from '@/lib/route-utils'

// PATCH /api/users/[id]/reject — Reject (suspend) a pending B2B user
export const PATCH = withErrorHandler(async (_req: Request, context: unknown) => {
  await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  const user = await prisma.user.findUnique({
    where: { id },
  })

  if (!user) {
    throw new ApiError(404, 'Korisnik nije pronađen')
  }

  if (user.status === 'suspended') {
    return successResponse({ message: 'Korisnik je već odbijen', userId: id })
  }

  await prisma.user.update({
    where: { id },
    data: { status: 'suspended' },
  })

  return successResponse({ message: 'B2B zahtev je odbijen', userId: id })
})
