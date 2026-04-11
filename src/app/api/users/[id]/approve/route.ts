import { prisma } from '@/lib/db'
import { withErrorHandler, successResponse, errorResponse, ApiError } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'
import { getRouteParams } from '@/lib/route-utils'
import { sendTransactional } from '@/lib/email'
import { b2bApprovedUserTemplate } from '@/lib/email-templates'

// PATCH /api/users/[id]/approve — Approve a pending B2B user
export const PATCH = withErrorHandler(async (_req: Request, context: unknown) => {
  const admin = await requireAdmin()
  const { id } = await getRouteParams<{ id: string }>(context)

  const user = await prisma.user.findUnique({
    where: { id },
    include: { b2bProfile: true },
  })

  if (!user) {
    throw new ApiError(404, 'Korisnik nije pronađen')
  }

  if (user.role !== 'b2b') {
    return errorResponse('Samo B2B korisnici mogu biti odobreni', 400)
  }

  if (user.status === 'active') {
    return errorResponse('Korisnik je već odobren', 400)
  }

  // Update user status and B2B profile in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: { status: 'active' },
    })

    if (user.b2bProfile) {
      await tx.b2bProfile.update({
        where: { userId: id },
        data: {
          approvedAt: new Date(),
          approvedBy: admin.id,
        },
      })
    }
  })

  void sendTransactional({
    to: user.email,
    subject: 'Vas Altamoda B2B nalog je odobren',
    html: b2bApprovedUserTemplate({
      name: user.name || '',
      salonName: user.b2bProfile?.salonName,
    }),
  }).catch((err) => console.error('[email] B2B approval notice failed:', err))

  return successResponse({ message: 'B2B korisnik je uspešno odobren', userId: id })
})
