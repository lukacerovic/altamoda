import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { hash } from 'bcryptjs'
import { prisma } from './db'

export const BCRYPT_ROUNDS = 12

export function hashPassword(password: string) {
  return hash(password, BCRYPT_ROUNDS)
}

/**
 * Old altamoda.rs (CodeIgniter) stored sha1(staticSalt + password) as 40 hex
 * chars. The salt lives only in the LEGACY_PASSWORD_SALT env var. Without it,
 * legacy logins are refused (users can still reset their password).
 */
export function verifyLegacyPassword(password: string, legacyHash: string): boolean {
  const salt = process.env.LEGACY_PASSWORD_SALT
  if (!salt || !/^[0-9a-f]{40}$/i.test(legacyHash)) return false
  const computed = createHash('sha1').update(salt + password, 'utf8').digest()
  return timingSafeEqual(computed, Buffer.from(legacyHash, 'hex'))
}

/** Password reset tokens: the raw token goes in the email link, only its sha256 is stored. */
export function createResetToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashResetToken(token) }
}

export function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

/** Exact match first (unique index), then case-insensitive, since old-site emails were typed freely. */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const trimmed = email.trim()
  const exact = await prisma.user.findUnique({ where: { email: trimmed }, select: { id: true } })
  if (exact) return exact.id
  const ci = await prisma.user.findFirst({
    where: { email: { equals: trimmed, mode: 'insensitive' } },
    select: { id: true },
  })
  return ci?.id ?? null
}
