import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './db'
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { b2bProfile: true },
        })

        if (!user) return null
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
