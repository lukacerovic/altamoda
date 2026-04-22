import { describe, it, expect } from 'vitest'
import { authConfig } from '@/lib/auth.config'

describe('Auth Config', () => {
  it('has JWT session strategy', () => {
    expect(authConfig.session?.strategy).toBe('jwt')
  })

  it('points to correct sign-in page', () => {
    expect(authConfig.pages?.signIn).toBe('/account/login')
  })

  it('has empty providers (providers added in auth.ts)', () => {
    expect(authConfig.providers).toEqual([])
  })

  it('has jwt callback', () => {
    expect(authConfig.callbacks?.jwt).toBeDefined()
    expect(typeof authConfig.callbacks?.jwt).toBe('function')
  })

  it('has session callback', () => {
    expect(authConfig.callbacks?.session).toBeDefined()
    expect(typeof authConfig.callbacks?.session).toBe('function')
  })

  it('has authorized callback for route protection', () => {
    expect(authConfig.callbacks?.authorized).toBeDefined()
    expect(typeof authConfig.callbacks?.authorized).toBe('function')
  })
})

describe('Auth Config - Route Authorization Logic', () => {
  const authorized = authConfig.callbacks!.authorized!

  function makeArgs(pathname: string, role?: string) {
    return {
      auth: role ? { user: { role } } : null,
      request: { nextUrl: { pathname } },
    } as Parameters<typeof authorized>[0]
  }

  // Admin routes
  it('blocks unauthenticated users from /admin', () => {
    expect(authorized(makeArgs('/admin'))).toBe(false)
  })

  it('blocks B2C users from /admin', () => {
    expect(authorized(makeArgs('/admin', 'b2c'))).toBe(false)
  })

  it('blocks B2B users from /admin', () => {
    expect(authorized(makeArgs('/admin', 'b2b'))).toBe(false)
  })

  it('allows admin to /admin', () => {
    expect(authorized(makeArgs('/admin', 'admin'))).toBe(true)
  })

  it('allows admin to /admin/products', () => {
    expect(authorized(makeArgs('/admin/products', 'admin'))).toBe(true)
  })

  // Account routes
  it('blocks unauthenticated from /account', () => {
    expect(authorized(makeArgs('/account'))).toBe(false)
  })

  it('allows any authenticated user to /account', () => {
    expect(authorized(makeArgs('/account', 'b2c'))).toBe(true)
    expect(authorized(makeArgs('/account', 'b2b'))).toBe(true)
    expect(authorized(makeArgs('/account', 'admin'))).toBe(true)
  })

  it('allows unauthenticated to /account/login', () => {
    expect(authorized(makeArgs('/account/login'))).toBe(true)
  })

  // Checkout — accessible to guests (they fill in contact info)
  it('allows unauthenticated to /checkout (guest checkout)', () => {
    expect(authorized(makeArgs('/checkout'))).toBe(true)
  })

  it('allows any authenticated user to /checkout', () => {
    expect(authorized(makeArgs('/checkout', 'b2c'))).toBe(true)
    expect(authorized(makeArgs('/checkout', 'b2b'))).toBe(true)
  })

  // Public routes
  it('allows everyone to public routes', () => {
    expect(authorized(makeArgs('/'))).toBe(true)
    expect(authorized(makeArgs('/products'))).toBe(true)
    expect(authorized(makeArgs('/cart'))).toBe(true)
    expect(authorized(makeArgs('/faq'))).toBe(true)
  })
})
