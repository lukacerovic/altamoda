import { auth } from './auth'
import { ApiError } from './api-utils'

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new ApiError(401, 'Morate biti prijavljeni')
  }
  return user
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
