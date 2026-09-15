'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  TrendingUp, Target, ArrowRight, Shield, Smartphone, BarChart3,
} from 'lucide-react'
import { WalletIcon } from '@/components/wallet-icon'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center">
            <WalletIcon className="h-7 w-7 text-primary mt-0.5 -mr-1.5" />
            <span className="font-brand text-lg font-bold text-foreground relative z-10">Spendio</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Personal Finance Tracker
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Your money,{' '}
              <span className="text-primary">your control.</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg max-w-xl mx-auto">
              Track expenses, manage accounts, set budgets, and reach savings goals — all in one simple place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-12 sm:mt-16 max-w-3xl">
            <div className="rounded-xl border border-border bg-card p-1 shadow-2xl shadow-primary/5">
              <div className="rounded-lg bg-muted/30 p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <div className="ml-4 h-4 w-32 rounded bg-muted" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Balance', value: 'Rp 12.5M', color: 'bg-primary/10 text-primary' },
                    { label: 'Income', value: 'Rp 8.2M', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' },
                    { label: 'Expenses', value: 'Rp 5.3M', color: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' },
                    { label: 'Net', value: '+Rp 2.9M', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-lg bg-card border border-border p-3">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-xs sm:text-sm font-heading font-bold mt-0.5 ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="col-span-2 rounded-lg bg-card border border-border p-3">
                    <div className="flex items-end gap-1 h-16">
                      {[40, 65, 50, 80, 60, 75, 45].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t bg-primary/20" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-card border border-border p-3 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Features you need</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">Simple, but powerful. No complicated features that confuse you.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            <FeatureCard
              icon={WalletIcon}
              title="Multi-Account"
              description="Bank, e-wallet, cash — all in one place."
            />
            <FeatureCard
              icon={BarChart3}
              title="Smart Categories"
              description="Category hierarchy with custom colors and icons."
            />
            <FeatureCard
              icon={Target}
              title="Budget & Savings"
              description="Set budgets per category and reach savings goals."
            />
            <FeatureCard
              icon={Shield}
              title="Secure Data"
              description="Email and Google authentication. Data is only accessible by you."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Visual Insights"
              description="Pie charts and bar charts for expense analysis."
            />
            <FeatureCard
              icon={Smartphone}
              title="Mobile Friendly"
              description="Responsive on all screen sizes. Access anytime, anywhere."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Ready to start?</h2>
            <p className="mt-3 text-sm text-muted-foreground">Create a free account. No credit card. No commitment.</p>
            <div className="mt-6">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Sign Up Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container mx-auto flex h-12 items-center justify-between px-4 sm:px-6">
          <p className="text-xs text-muted-foreground">Spendio &copy; {new Date().getFullYear()}</p>
          <p className="text-xs text-muted-foreground">Built with Next.js + PostgreSQL</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/30">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
