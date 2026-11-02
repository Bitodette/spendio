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

      <section>
        <div className="container mx-auto px-4 sm:px-6 pt-16 pb-16 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-24">
          <div className="mx-auto max-w-xl text-center">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Know where every rupiah goes.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Track spending, set budgets, and hit savings goals without another spreadsheet.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start for free
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                  Sign in
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Free to use. No credit card required.
            </p>
          </div>
        </div>
      </section>

      <FeaturesSection />
      <CtaSection />
      <Footer />
    </div>
  )
}
