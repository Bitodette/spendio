'use client'

import { Target, Shield, Smartphone, BarChart3, TrendingUp } from 'lucide-react'
import { WalletIcon } from '@/components/wallet-icon'

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

export function FeaturesSection() {
  return (
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
  )
}
