'use client'

import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
  ArrowDownLeft, ArrowUpRight, Calendar, ChevronRight, Plus, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import type { Transaction } from '@/lib/api/transactions'

interface Props {
  transactions: Transaction[]
  onAdd: () => void
  onInspect: (tx: Transaction) => void
  addDisabled?: boolean
  hasFilters: boolean
  onClearFilters: () => void
}

function dayLabel(date: string): string {
  const parsed = parseISO(date)
  if (isToday(parsed)) return 'Today'
  if (isYesterday(parsed)) return 'Yesterday'
  return format(parsed, 'EEEE, d MMM yyyy', { locale: idLocale })
}

function groupByDay(transactions: Transaction[]): Array<[string, Transaction[]]> {
  const groups = new Map<string, Transaction[]>()
  for (const transaction of transactions) {
    const day = groups.get(transaction.date)
    if (day) day.push(transaction)
    else groups.set(transaction.date, [transaction])
  }
  return Array.from(groups.entries())
}

export function TransactionList({
  transactions, onAdd, onInspect, addDisabled, hasFilters, onClearFilters,
}: Props) {
  if (transactions.length === 0) {
    const Icon = hasFilters ? Search : Calendar
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">
          {hasFilters ? 'No matching transactions' : 'No transactions yet'}
        </p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {hasFilters
            ? 'Try a different search, date range, or filter.'
            : 'Add your first transaction to start tracking your money.'}
        </p>
        {hasFilters ? (
          <Button variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : (
          <Button onClick={onAdd} variant="outline" size="sm" className="mt-4 gap-1.5" disabled={addDisabled}>
            <Plus className="h-3.5 w-3.5" /> Add transaction
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      {groupByDay(transactions).map(([date, items]) => {
        const dayNet = items.reduce(
          (sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount),
          0,
        )

        return (
          <section key={date}>
            <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2 first:border-t-0">
              <p className="text-xs font-medium text-muted-foreground">{dayLabel(date)}</p>
              <p className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                <span>{items.length} {items.length === 1 ? 'transaction' : 'transactions'}</span>
                <span className="hidden sm:inline" aria-hidden="true">·</span>
                <span className={cn(
                  'hidden font-medium sm:inline',
                  dayNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                )}>
                  {dayNet >= 0 ? '+' : ''}{formatCurrency(dayNet)}
                </span>
              </p>
            </div>

            <div className="divide-y divide-border">
              {items.map(tx => {
                const title = tx.description || tx.category?.name || 'Transaction'
                const meta = [tx.account?.name, tx.category?.name].filter(Boolean).join(' · ')
                const Icon = tx.type === 'income' ? ArrowDownLeft : ArrowUpRight

                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => onInspect(tx)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      tx.type === 'income'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
                    )}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{title}</span>
                      {meta && (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{meta}</span>
                      )}
                    </span>

                    <span className={cn(
                      'shrink-0 text-sm font-semibold tabular-nums',
                      tx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                    )}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>

                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
