'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { WalletIcon } from '@/components/wallet-icon'

const FeaturesSection = dynamic(() => import('./_components/features-section').then((mod) => mod.FeaturesSection), {
  loading: () => <div className="h-96" />,
})
const CtaSection = dynamic(() => import('./_components/cta-section').then((mod) => mod.CtaSection), {
  loading: () => <div className="h-64" />,
})
const Footer = dynamic(() => import('./_components/footer').then((mod) => mod.Footer))

export default function HomePage() {

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

      <FeaturesSection />
      <CtaSection />
      <Footer />
    </div>
  )
}
