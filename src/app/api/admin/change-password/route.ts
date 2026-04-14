import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-utils'
import { requireAdmin } from '@/lib/auth-helpers'

export const PUT = withErrorHandler(async (req: Request) => {
  const user = await requireAdmin()
  const { newPassword } = await req.json()

  if (!newPassword) {
    return errorResponse('Nova lozinka je obavezna', 400)
  }

  if (newPassword.length < 8) {
    return errorResponse('Nova lozinka mora imati najmanje 8 karaktera', 400)
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  return successResponse({ message: 'Lozinka uspešno promenjena' })
})
