import { auth } from './auth'
import { ApiError } from './api-utils'
import { prisma } from './db'

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new ApiError(401, 'Morate biti prijavljeni')
  }

  // Re-check user status from DB to catch suspended/pending users mid-session
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { status: true, role: true },
  })

  if (!dbUser || dbUser.status === 'suspended') {
    throw new ApiError(403, 'Vaš nalog je suspendovan')
  }
  if (dbUser.status === 'pending') {
    throw new ApiError(403, 'Vaš nalog još uvek čeka odobrenje')
  }

  // Return user with fresh role/status from DB
  return { ...user, role: dbUser.role, status: dbUser.status }
}

export async function requireAdmin() {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    throw new ApiError(403, 'Nemate pristup ovoj stranici')
  }
  return user
}

export async function requireB2b() {
  const user = await requireAuth()
  if (user.role !== 'b2b' && user.role !== 'admin') {
    throw new ApiError(403, 'Samo za B2B korisnike')
  }
  return user
}
