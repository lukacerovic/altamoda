import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from './db'
import { authConfig } from './auth.config'

// PrismaAdapter ships against a top-level @auth/core, but next-auth has its own
// nested copy. The Adapter shape is identical at runtime — the cast bridges the
// duplicate-package type mismatch without sacrificing type safety elsewhere.
const adapter = PrismaAdapter(prisma) as unknown as NextAuthConfig['adapter']

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { b2bProfile: true },
        })

        if (!user) return null
        // OAuth-only users have no password — block password login for them.
        if (!user.passwordHash) return null

        const isValidPassword = await compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValidPassword) return null

        if (user.status === 'suspended') return null
        if (user.status === 'pending') return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Google returns email_verified=true for Gmail/Workspace, so linking a
      // Google sign-in to an existing email+password B2C user is safe.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Email+password path is unchanged.
      if (account?.provider === 'credentials') return true

      if (account?.provider === 'google') {
        const email = user.email?.toLowerCase()
        if (!email) return '/account/login?error=OAuthMissingEmail'

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
          // Google login is reserved for B2C — B2B and admin must use email+password.
          if (existing.role !== 'b2c') {
            return '/account/login?error=OAuthB2bBlocked'
          }
          if (existing.status === 'suspended') {
            return '/account/login?error=AccountSuspended'
          }
        }
        // First-time OAuth signup: adapter creates User with schema defaults
        // (role=b2c, status=active). The createUser event below enforces this.
        return true
      }

      // Reject any other provider that isn't explicitly allowed.
      return false
    },
    async jwt({ token, user, trigger }) {
      // On initial sign-in, NextAuth passes `user` from the provider/adapter.
      // For OAuth users the `user` shape is the raw User row — load role/status from DB.
      if (user) {
        token.id = user.id as string
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { role: true, status: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.status = dbUser.status
        }
      }
      // On session refresh, ensure the JWT picks up status changes (e.g. suspension).
      if (trigger === 'update' && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.status = dbUser.status
        }
      }
      return token
    },
  },
  events: {
    async createUser({ user }) {
      // Belt-and-braces: any user created via the OAuth adapter is a B2C user.
      // Schema defaults already do this, but be explicit so future schema changes
      // don't accidentally create OAuth users with the wrong role/status.
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'b2c', status: 'active' },
      })
    },
  },
})
