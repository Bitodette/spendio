'use client'

import { Target, Shield, Smartphone, BarChart3, TrendingUp } from 'lucide-react'
import { WalletIcon } from '@/components/wallet-icon'
import { cn } from '@/lib/utils'

function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20', className)}>
      <Icon className="mb-4 h-5 w-5 text-primary" />
      <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

export function FeaturesSection() {
  return (
    <section className="border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">What you can do</h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            No complicated setup. Just the tools you will actually use.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          <FeatureCard
            icon={WalletIcon}
            title="Multi-Account"
            description="See every balance in one place, from bank accounts to cash."
            className="lg:col-span-2"
          />
          <FeatureCard
            icon={BarChart3}
            title="Smart Categories"
            description="Group spending your way, with your own colors and icons."
          />
          <FeatureCard
            icon={Target}
            title="Budget & Savings"
            description="Set limits per category and get closer to your savings goals."
          />
          <FeatureCard
            icon={TrendingUp}
            title="Visual Insights"
            description="Spot spending patterns with charts that are actually easy to read."
            className="lg:col-span-2"
          />
          <FeatureCard
            icon={Shield}
            title="Secure Data"
            description="Your data stays yours. Sign in with email or Google."
          />
          <FeatureCard
            icon={Smartphone}
            title="Mobile Friendly"
            description="Check your balance from anywhere, on any screen."
            className="lg:col-span-2"
          />
        </div>
      </div>
    </section>
  )
}
