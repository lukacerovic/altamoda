import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError } from '@/lib/api-utils'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { getCurrentUser, requireAuth, requireAdmin, requireB2b } from '@/lib/auth-helpers'

const mockAuth = vi.mocked(auth)

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user when session exists', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'b2c', status: 'active' },
      expires: '2026-12-31',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    const user = await getCurrentUser()
    expect(user).not.toBeNull()
    expect(user?.email).toBe('test@test.com')
  })

  it('returns null when no session', async () => {
    mockAuth.mockResolvedValue(null as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    const user = await getCurrentUser()
    expect(user).toBeNull()
  })
})

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user when authenticated', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'b2c', status: 'active' },
      expires: '2026-12-31',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    const user = await requireAuth()
    expect(user.email).toBe('test@test.com')
  })

  it('throws 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    await expect(requireAuth()).rejects.toThrow(ApiError)
    await expect(requireAuth()).rejects.toThrow('Morate biti prijavljeni')
  })
})

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user when admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin', status: 'active' },
      expires: '2026-12-31',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    const user = await requireAdmin()
    expect((user as Record<string, unknown>).role).toBe('admin')
  })

  it('throws 403 when not admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'user@test.com', name: 'User', role: 'b2c', status: 'active' },
      expires: '2026-12-31',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    await expect(requireAdmin()).rejects.toThrow(ApiError)
  })

  it('throws 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    await expect(requireAdmin()).rejects.toThrow('Morate biti prijavljeni')
  })
})

describe('requireB2b', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows B2B user', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'salon@test.com', name: 'Salon', role: 'b2b', status: 'active' },
      expires: '2026-12-31',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    const user = await requireB2b()
    expect(user).toBeDefined()
  })

  it('allows admin user', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin', status: 'active' },
      expires: '2026-12-31',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    const user = await requireB2b()
    expect(user).toBeDefined()
  })

  it('throws 403 for B2C user', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'user@test.com', name: 'User', role: 'b2c', status: 'active' },
      expires: '2026-12-31',
    } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)
    await expect(requireB2b()).rejects.toThrow('Samo za B2B korisnike')
  })
})
