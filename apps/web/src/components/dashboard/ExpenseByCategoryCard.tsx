'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CategorySlice } from '@/lib/analytics/categories'
import { formatCurrency } from '@/lib/utils'

const MAX_ROWS = 8

export function ExpenseByCategoryCard({
  slices,
  periodLabel,
}: {
  slices: CategorySlice[]
  periodLabel: string
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const rows = slices.length > MAX_ROWS
    ? [
        ...slices.slice(0, MAX_ROWS - 1),
        {
          name: 'Other categories',
          value: slices.slice(MAX_ROWS - 1).reduce((sum, slice) => sum + slice.value, 0),
          color: 'var(--color-muted-foreground)',
        },
      ]
    : slices

  return (
    <div className="md:col-span-2 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-sm font-semibold text-foreground">Spending by category</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{periodLabel}</p>
        </div>
        <p className="font-heading text-sm font-semibold tabular-nums text-foreground">
          {formatCurrency(total)}
        </p>
      </div>

      {slices.length === 0 ? (
        <div className="flex h-[268px] flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">No spending recorded</p>
          <p className="mt-1 text-xs text-muted-foreground">Expenses you add will show up here.</p>
          <Link href="/transactions">
            <Button variant="outline" size="sm" className="mt-3 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add transaction
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3.5">
          {rows.map(row => {
            const share = total > 0 ? (row.value / total) * 100 : 0
            return (
              <div key={row.name}>
                <div className="flex items-baseline gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="flex-1 truncate text-xs font-medium text-foreground">
                    {row.name}
                  </span>
                  <span className="text-xs tabular-nums text-foreground">
                    {formatCurrency(row.value)}
                  </span>
                  <span className="w-8 text-right text-[11px] tabular-nums text-muted-foreground">
                    {share.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1.5 ml-4 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${share}%`, backgroundColor: row.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
