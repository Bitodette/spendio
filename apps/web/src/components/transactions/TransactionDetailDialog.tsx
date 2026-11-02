'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { ArrowDownLeft, ArrowUpRight, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { cn, formatCurrency } from '@/lib/utils'
import type { Transaction } from '@/lib/api/transactions'

interface Props {
  transaction: Transaction | null
  onClose: () => void
  onEdit: (tx: Transaction) => void
  onDelete: (tx: Transaction) => void
  deleteError?: unknown
  isDeleting?: boolean
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-3">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-foreground">{children}</dd>
    </div>
  )
}

export function TransactionDetailDialog({
  transaction,
  onClose,
  onEdit,
  onDelete,
  deleteError,
  isDeleting,
}: Props) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const confirmingDelete = Boolean(transaction && confirmingId === transaction.id)
  const closeDialog = () => {
    setConfirmingId(null)
    onClose()
  }

  return (
    <Dialog open={Boolean(transaction)} onOpenChange={open => { if (!open) closeDialog() }}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        {transaction && (
          <>
            <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left sm:px-6">
              <DialogTitle className="text-lg font-semibold">Transaction details</DialogTitle>
              <DialogDescription>
                {format(parseISO(transaction.date), 'EEEE, d MMMM yyyy', { locale: idLocale })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-5 py-5 sm:px-6">
              <div className={cn(
                'rounded-xl border p-4',
                transaction.type === 'income'
                  ? 'border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                  : 'border-red-200/70 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20',
              )}>
                <div className="flex items-center justify-between gap-3">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium',
                    transaction.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
                  )}>
                    {transaction.type === 'income'
                      ? <ArrowDownLeft className="h-3.5 w-3.5" />
                      : <ArrowUpRight className="h-3.5 w-3.5" />}
                    {transaction.type === 'income' ? 'Income' : 'Expense'}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Amount
                  </span>
                </div>

                <p className={cn(
                  'mt-2 font-heading text-3xl font-bold tabular-nums',
                  transaction.type === 'income'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
                )}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>

                {transaction.description && (
                  <p className="mt-1 break-words text-sm text-foreground">
                    {transaction.description}
                  </p>
                )}
              </div>

              <dl className="divide-y divide-border rounded-xl border border-border">
                <DetailRow label="Account">{transaction.account?.name || '—'}</DetailRow>
                <DetailRow label="Category">{transaction.category?.name || 'Uncategorized'}</DetailRow>
                <DetailRow label="Recorded">
                  <span className="font-normal text-muted-foreground">
                    {format(new Date(transaction.created_at), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                  </span>
                </DetailRow>
              </dl>

              <ErrorNotice error={deleteError} className="text-xs" />

              {confirmingDelete && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                  <p className="text-xs font-medium text-foreground">Delete this transaction?</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">This action can’t be undone.</p>
                </div>
              )}
            </div>

            {confirmingDelete ? (
              <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 rounded-b-2xl border-t bg-muted/30 px-5 py-4 sm:px-6">
                <Button
                  variant="outline"
                  className="h-9 flex-1"
                  onClick={() => setConfirmingId(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="h-9 flex-1"
                  onClick={() => onDelete(transaction)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete transaction'}
                </Button>
              </DialogFooter>
            ) : (
              <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-2 rounded-b-2xl border-t bg-muted/30 px-5 py-4 sm:px-6">
                <Button
                  variant="outline"
                  className="h-9 flex-1 gap-2 text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmingId(transaction.id)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <Button className="h-9 flex-1 gap-2" onClick={() => onEdit(transaction)}>
                  <Edit className="h-4 w-4" /> Edit
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
