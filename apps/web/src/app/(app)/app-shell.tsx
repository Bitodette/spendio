'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Target, LogOut, Menu, X, PieChart, TrendingUp, Repeat, PiggyBank,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { WalletIcon } from '@/components/wallet-icon'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: TrendingUp },
  { name: 'Accounts', href: '/accounts', icon: WalletIcon },
  { name: 'Categories', href: '/categories', icon: PieChart },
  { name: 'Recurring', href: '/recurring', icon: Repeat },
  { name: 'Budgets', href: '/budgets', icon: Target },
  { name: 'Savings', href: '/savings', icon: PiggyBank },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!sidebarOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [sidebarOpen])

  if (!user) return null

  const userInitial = user.email?.charAt(0).toUpperCase() || 'U'
  const userName = user.name || user.email?.split('@')[0]

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="app-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-56 flex-col bg-card border-r border-border transition-transform duration-200 ease-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center border-b border-border px-5 lg:h-16">
          <div className="hidden items-center lg:flex">
            <WalletIcon className="h-8 w-8 text-primary mt-1 -mr-2.5" />
            <span className="font-brand text-xl font-bold tracking-tight text-foreground relative z-10">Spendio</span>
          </div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground lg:hidden">
            Menu
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-11 w-11 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group flex min-h-12 items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-150 lg:min-h-0 lg:py-2',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                <item.icon className={cn('h-5 w-5 shrink-0 lg:h-4 lg:w-4', isActive && 'text-primary')} />
                {item.name}
              </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-border px-3 py-3">
          <div className="space-y-0.5">
            <button
              onClick={handleSignOut}
              className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 lg:min-h-0 lg:py-2"
            >
              <LogOut className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" />
              Sign out
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {userName}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-56">
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            aria-controls="app-sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link
            href="/dashboard"
            className="flex flex-1 items-center justify-center"
            aria-label="Spendio dashboard"
          >
            <WalletIcon className="h-6 w-6 text-primary mt-0.5 -mr-1" />
            <span className="font-brand text-lg font-bold tracking-tight text-foreground relative z-10">Spendio</span>
          </Link>
          <div className="h-11 w-11" aria-hidden="true" />
        </header>

        <main className="p-4 lg:p-8 xl:p-10">{children}</main>
      </div>
    </div>
  )
}
