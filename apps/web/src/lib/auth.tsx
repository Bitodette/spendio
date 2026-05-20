'use client'

import { createContext, useContext, ReactNode } from 'react'
import { authClient } from '@/lib/auth-client'

export interface AuthUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  image?: string | null
}

export interface AuthSession {
  id: string
  userId: string
  expiresAt: Date | string
}

interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession()

  const user = (data?.user as AuthUser | undefined) ?? null
  const session = (data?.session as AuthSession | undefined) ?? null

  const signIn = async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password })
    return { error: error ? new Error(error.message) : null }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: fullName?.trim() || email.split('@')[0],
      callbackURL: `${window.location.origin}/dashboard`,
    })
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    await authClient.signOut()
  }

  const signInWithGoogle = async () => {
    const { data, error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/dashboard`,
      errorCallbackURL: `${window.location.origin}/login`,
    })

    if (error) return { error: new Error(error.message) }
    if (data?.url) window.location.href = data.url
    return { error: null }
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading: isPending, signIn, signUp, signOut, signInWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
