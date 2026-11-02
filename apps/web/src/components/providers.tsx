'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth'
import { QueryAuthSync, QueryProvider } from '@/lib/query-provider'

export function AuthProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <QueryAuthSync />
        {children}
      </AuthProvider>
    </QueryProvider>
  )
}
