'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Plus, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import type { RecentTransaction } from '@/types/database'

export function RecentTransactionsCard({
  transactions,
  categoryNames,
}: {
  transactions: RecentTransaction[]
  categoryNames: Record<string, string>
}) {
  const router = useRouter()

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="font-heading text-sm font-semibold text-foreground">Recent Transactions</h2>
          <p className="text-xs text-muted-foreground">This month</p>
        </div>
        <Link href="/transactions">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            View All <ArrowUpRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <p className="text-sm font-medium text-foreground">No transactions this month</p>
          <p className="text-xs text-muted-foreground mt-1">Start by adding your first transaction</p>
          <Link href="/transactions">
            <Button variant="outline" size="sm" className="mt-4 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Transaction
            </Button>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {transactions.map(tx => {
            const categoryName = tx.category_id ? categoryNames[tx.category_id] : null
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => router.push('/transactions')}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tx.description || categoryName || 'Transaction'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {tx.account?.name} · {format(new Date(tx.date), 'd MMM yyyy', { locale: idLocale })}
                    {categoryName && tx.description && <span className="ml-1">· {categoryName}</span>}
                  </p>
                </div>
                <span className={cn(
                  'text-sm font-semibold tabular-nums shrink-0 ml-4',
                  tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
