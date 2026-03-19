import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'

export const GET = withErrorHandler(async () => {
  const sessionUser = await requireAuth()

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      avatarUrl: true,
      createdAt: true,
      b2bProfile: true,
      addresses: true,
    },
  })

  if (!user) {
    return errorResponse('Korisnik nije pronađen', 404)
  }

  return successResponse(user)
})

export const PUT = withErrorHandler(async (req: Request) => {
  const sessionUser = await requireAuth()
  const body = await req.json()

  const user = await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      name: body.name,
      phone: body.phone,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
    },
  })

  return successResponse(user)
})
