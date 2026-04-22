import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/account/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours instead of default 30 days
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
      // /checkout is accessible to guests (they fill in contact info)
      // The API will handle auth requirements when placing the order
      return true
    },
  },
  providers: [], // providers added in auth.ts (not needed for middleware)
}
