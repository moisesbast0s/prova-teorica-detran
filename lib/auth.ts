import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'

function getCredentialValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeGuestId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Convidado",
      credentials: {
        name: { label: "Seu nome", type: "text", placeholder: "Ex: João" },
        guestId: { label: "ID do convidado", type: "hidden" },
      },
      async authorize(credentials) {
        const name = getCredentialValue(credentials?.name)
        const guestId = normalizeGuestId(getCredentialValue(credentials?.guestId))

        if (!name || !guestId) return null

        const email = `guest-${guestId}@guest.local`

        let user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              name,
              email,
              image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${guestId}`,
            }
          })
        } else if (user.name !== name) {
          user = await prisma.user.update({
            where: { email },
            data: { name },
          })
        }

        return user
      }
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
