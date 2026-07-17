'use client'

import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Plus, Edit, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency } from '@/lib/utils'
import type { Transaction } from '@/lib/api/transactions'

interface Props {
  transactions: Transaction[]
  onAdd: () => void
  onInspect: (tx: Transaction) => void
  onEdit: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
  addDisabled?: boolean
}

export function TransactionList({
  transactions, onAdd, onInspect, onEdit, onDelete, addDisabled,
}: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No transactions yet</p>
        <p className="text-xs text-muted-foreground mt-1">Add your first transaction to start tracking</p>
        <Button onClick={onAdd} variant="outline" size="sm" className="mt-4 gap-1.5" disabled={addDisabled}>
          <Plus className="h-3.5 w-3.5" /> Add Transaction
        </Button>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {transactions.map(tx => (
        <div
          key={tx.id}
          className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
          onClick={() => onInspect(tx)}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {tx.description || tx.category?.name || 'Transaction'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {tx.account?.name} · {format(new Date(tx.date), 'd MMM yyyy', { locale: idLocale })}
              {tx.category?.name && tx.description && <span className="ml-1">· {tx.category.name}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-3">
            <span className={cn(
              'text-sm font-semibold tabular-nums',
              tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            )}>
              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
            </span>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                aria-label={`Edit ${tx.description || 'transaction'}`}
                onClick={e => { e.stopPropagation(); onEdit(tx) }}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                aria-label={`Delete ${tx.description || 'transaction'}`}
                onClick={e => { e.stopPropagation(); onDelete(tx) }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
