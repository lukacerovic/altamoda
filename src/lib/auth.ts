import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './db'
import { findUserIdByEmail, hashPassword, verifyLegacyPassword } from './password'
import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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

        const userId = await findUserIdByEmail(credentials.email as string)
        if (!userId) return null
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { b2bProfile: true },
        })

        if (!user) return null
        const password = credentials.password as string

        if (user.passwordHash) {
          if (!(await compare(password, user.passwordHash))) return null
        } else if (user.legacyPasswordHash) {
          // Account imported from the old site: verify the old SHA-1 hash once,
          // then upgrade to bcrypt and drop the legacy hash.
          if (!verifyLegacyPassword(password, user.legacyPasswordHash)) return null
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: await hashPassword(password), legacyPasswordHash: null },
          })
        } else {
          return null
        }

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
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // On initial sign-in, NextAuth passes `user` from the provider.
      // Load the authoritative role/status from the DB.
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
})
