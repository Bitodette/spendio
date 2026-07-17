'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { ChartTooltip } from '@/components/dashboard/ChartTooltip'
import { flattenChildren, type CategorySlice } from '@/lib/analytics/categories'
import { cn, formatCurrency } from '@/lib/utils'

export function ExpenseByCategoryCard({ slices }: { slices: CategorySlice[] }) {
  const cells = flattenChildren(slices)

  return (
    <div className="md:col-span-2 rounded-xl border border-border bg-card p-5">
      <div className="mb-1">
        <h2 className="font-heading text-sm font-semibold text-foreground">Expense by Category</h2>
        <p className="text-xs text-muted-foreground">Last 6 months</p>
      </div>

      {slices.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-sm text-muted-foreground">No expense data yet</p>
          <Link href="/transactions">
            <Button variant="outline" size="sm" className="mt-3 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Transaction
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={cells}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={0}
                strokeWidth={1}
                stroke="hsl(var(--background))"
              >
                {cells.map((cell, i) => (
                  <Cell key={`${cell.name}-${i}`} fill={cell.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="w-full space-y-2">
            {slices.map(slice => {
              const split = slice.children.length > 1
              return (
                <div key={slice.name}>
                  <div className="flex items-center gap-2">
                    {!split && <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />}
                    <span className={cn('flex-1 truncate', split ? 'text-[11px] font-medium text-foreground' : 'text-[11px] text-muted-foreground')}>
                      {slice.name}
                    </span>
                    <span className={cn('tabular-nums', split ? 'text-[11px] font-medium text-foreground' : 'text-[11px] text-muted-foreground')}>
                      {formatCurrency(slice.value)}
                    </span>
                  </div>
                  {split && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {slice.children.map(child => (
                        <div key={child.name} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: child.color }} />
                          <span className="text-[10px] text-muted-foreground flex-1 truncate">{child.name}</span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{formatCurrency(child.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
