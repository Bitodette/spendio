import { Suspense } from 'react'
import { AuthProviders } from '@/components/providers'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviders>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        {children}
      </Suspense>
    </AuthProviders>
  )
}
