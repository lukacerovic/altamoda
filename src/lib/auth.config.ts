import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/account/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as unknown as Record<string, unknown>).role as string
        token.status = (user as unknown as Record<string, unknown>).status as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as unknown as Record<string, unknown>).role = token.role
        ;(session.user as unknown as Record<string, unknown>).status = token.status
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user as { role?: string } | undefined
      const { pathname } = nextUrl

      if (pathname.startsWith('/admin')) {
        return user?.role === 'admin'
      }
      if (pathname.startsWith('/account') && !pathname.startsWith('/account/login')) {
        return !!user
      }
      if (pathname.startsWith('/quick-order')) {
        return user?.role === 'b2b' || user?.role === 'admin'
      }
      if (pathname.startsWith('/checkout')) {
        return !!user
      }
      return true
    },
  },
  providers: [], // providers added in auth.ts (not needed for middleware)
}
