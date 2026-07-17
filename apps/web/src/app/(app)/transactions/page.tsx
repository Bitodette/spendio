'use client'

import { useState } from 'react'
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionsSkeleton } from '@/components/transactions/TransactionsSkeleton'
import { TransactionFiltersBar } from '@/components/transactions/TransactionFiltersBar'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionDialog } from '@/components/transactions/TransactionDialog'
import { TransactionDetailDialog } from '@/components/transactions/TransactionDetailDialog'
import { useAuth } from '@/lib/auth'
import {
  EMPTY_FILTERS, deleteTransaction, fetchAccountOptions, fetchCategories, fetchTransactionPage,
  type Transaction, type TransactionFilters,
} from '@/lib/api/transactions'
import { queryKeys } from '@/lib/query-keys'
import { invalidateTransactionQueries } from '@/lib/query-invalidation'
import { ErrorNotice } from '@/components/ui/error-notice'
import { cn, formatCurrency } from '@/lib/utils'

export default function TransactionsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // `undefined` closes the editor; `null` starts a new transaction.
  const [editing, setEditing] = useState<Transaction | null | undefined>(undefined)
  const [detail, setDetail] = useState<Transaction | null>(null)

  const transactionsQuery = useInfiniteQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: ({ pageParam }) => fetchTransactionPage(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: lastPage => lastPage.nextCursor,
    enabled: Boolean(user),
    placeholderData: keepPreviousData,
  })
  const optionsQuery = useQuery({
    queryKey: queryKeys.transactions.options,
    queryFn: async () => {
      const [accounts, categories] = await Promise.all([fetchAccountOptions(), fetchCategories()])
      return { accounts, categories }
    },
    enabled: Boolean(user),
  })
  const transactionPages = transactionsQuery.data?.pages ?? []
  const transactions = transactionPages.flatMap(page => page.items)
  const summary = transactionPages[0]?.summary
  const accounts = optionsQuery.data?.accounts ?? []
  const categories = optionsQuery.data?.categories ?? []
  const optionsUnavailable = optionsQuery.isError && !optionsQuery.data
  const loading = transactionsQuery.isPending || optionsQuery.isPending

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      setDetail(null)
      await invalidateTransactionQueries(queryClient)
    },
  })

  const openAdd = () => setEditing(null)
  const openDetail = (tx: Transaction) => {
    deleteMutation.reset()
    setDetail(tx)
  }
  const openEdit = (tx: Transaction) => { setDetail(null); setEditing(tx) }

  const remove = (tx: Transaction) => {
    if (!confirm('Delete this transaction?')) return
    deleteMutation.reset()
    deleteMutation.mutate(tx.id)
  }

  if (!user) return null
  if (loading) return <TransactionsSkeleton />

  if (transactionsQuery.isError && !transactionsQuery.data) {
    return (
      <ErrorNotice
        error={transactionsQuery.error}
        onRetry={() => transactionsQuery.refetch()}
      />
    )
  }

  const totalIncome = summary?.income ?? 0
  const totalExpense = summary?.expense ?? 0
  const net = summary?.net ?? 0
  const queryError = transactionsQuery.isFetchNextPageError ? null : transactionsQuery.error
  const canLoadMore = transactionsQuery.hasNextPage && !transactionsQuery.isPlaceholderData

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Transaction</h1>
          <p className="text-sm text-muted-foreground">Manage income and expenses</p>
        </div>
        <Button onClick={openAdd} className="gap-2" disabled={optionsUnavailable}>
          <Plus className="h-4 w-4" /> Add Transaction
        </Button>
      </div>

      {(queryError || optionsQuery.isError) && (
        <ErrorNotice
          error={queryError ?? optionsQuery.error}
          onRetry={() => {
            void transactionsQuery.refetch()
            void optionsQuery.refetch()
          }}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
        <div className="bg-card p-3 sm:p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Income</p>
          <p className="font-heading text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-card p-3 sm:p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expense</p>
          <p className="font-heading text-base sm:text-lg font-bold text-red-600 dark:text-red-400 mt-1 tabular-nums">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-card p-3 sm:p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net</p>
          <p className={cn('font-heading text-base sm:text-lg font-bold mt-1 tabular-nums', net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
            {formatCurrency(net)}
          </p>
        </div>
      </div>

      <TransactionFiltersBar
        filters={filters}
        onChange={patch => setFilters(p => ({ ...p, ...patch }))}
        onToggleAdvanced={() => setShowAdvanced(v => !v)}
        advancedOpen={showAdvanced}
        accounts={accounts}
        categories={categories}
      />

      {deleteMutation.error && !detail && (
        <ErrorNotice error={deleteMutation.error} />
      )}

      <div className="rounded-xl border border-border bg-card">
        <TransactionList
          transactions={transactions}
          onAdd={openAdd}
          onInspect={openDetail}
          onEdit={openEdit}
          onDelete={remove}
          addDisabled={optionsUnavailable}
        />
        {transactionsQuery.isFetchNextPageError ? (
          <div className="border-t border-border p-4">
            <ErrorNotice
              error={transactionsQuery.error}
              onRetry={() => { void transactionsQuery.fetchNextPage() }}
            />
          </div>
        ) : canLoadMore ? (
          <div className="border-t border-border p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { void transactionsQuery.fetchNextPage() }}
              disabled={transactionsQuery.isFetchingNextPage}
            >
              {transactionsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        ) : null}
      </div>

      {editing !== undefined && (
        <TransactionDialog
          key={editing?.id ?? 'new'}
          open
          onOpenChange={open => { if (!open) setEditing(undefined) }}
          editing={editing}
          accounts={accounts}
          categories={categories}
        />
      )}

      <TransactionDetailDialog
        transaction={detail}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
        onDelete={remove}
        deleteError={deleteMutation.error}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
