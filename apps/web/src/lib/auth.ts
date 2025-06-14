import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
          if (!apiUrl || apiUrl.trim() === '') {
            console.error('API URL is not configured')
            return null
          }
          const response = await fetch(`${apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            return null
          }

          const data = await response.json()
          
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            accessToken: data.token,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        if (account.provider === 'google') {
          // Handle Google OAuth
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
            if (!apiUrl || apiUrl.trim() === '') {
              console.error('API URL is not configured for Google OAuth')
              token.accessToken = null
              return token
            }
          const response = await fetch(`${apiUrl}/api/auth/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                name: user.name,
                provider: 'google',
              }),
            })

            if (response.ok) {
              const data = await response.json()
              token.accessToken = data.token
            } else {
              console.error('Google OAuth API error:', await response.text())
              token.accessToken = null
            }
          } catch (error) {
            console.error('Google OAuth error:', error)
            token.accessToken = null
          }
        } else {
          // Handle credentials login
          token.accessToken = user.accessToken
        }
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
}