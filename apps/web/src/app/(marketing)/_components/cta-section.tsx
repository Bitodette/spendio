'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CtaSection() {
  return (
    <section className="border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Start with one transaction.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Log your first expense, and the rest gets easier from there.
          </p>
          <div className="mt-6">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
