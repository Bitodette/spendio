import type { ReactNode } from 'react'
import { AppProviders } from '@/components/providers'
import { AppShell } from './app-shell'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <AppShell>{children}</AppShell>
    </AppProviders>
  )
}
