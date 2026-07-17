'use client'

import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{children}</span>
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
  return (
    <Dialog open={Boolean(transaction)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {transaction && (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading">Transaction Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="text-center">
                <p className={cn(
                  'font-heading text-3xl font-bold tabular-nums',
                  transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
                <p className={cn(
                  'inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-medium',
                  transaction.type === 'income'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                )}>
                  {transaction.type === 'income' ? 'Income' : 'Expense'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Row label="Date">
                  {format(new Date(transaction.date), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                </Row>
                <Row label="Account">{transaction.account?.name || '-'}</Row>
                <Row label="Category">{transaction.category?.name || '-'}</Row>
                {transaction.description && (
                  <div className="py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground block mb-1">Description</span>
                    <span className="text-sm text-foreground">{transaction.description}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-muted-foreground">Created</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(transaction.created_at), 'd MMM yyyy, HH:mm', { locale: idLocale })}
                  </span>
                </div>
              </div>
            </div>
            <ErrorNotice error={deleteError} className="text-xs" />
            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => onEdit(transaction)} className="gap-2">
                <Edit className="h-4 w-4" /> Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => onDelete(transaction)}
                disabled={isDeleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" /> {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
