'use client'

import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionsSkeleton } from '@/components/transactions/TransactionsSkeleton'
import { TransactionFiltersBar } from '@/components/transactions/TransactionFiltersBar'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionDialog } from '@/components/transactions/TransactionDialog'
import { TransactionDetailDialog } from '@/components/transactions/TransactionDetailDialog'
import { useAuth } from '@/lib/auth'
import {
  EMPTY_FILTERS, deleteTransaction, fetchAccountOptions, fetchCategories, fetchTransactionPage,
  type DateRange, type Transaction, type TransactionFilters,
} from '@/lib/api/transactions'
import { queryKeys } from '@/lib/query-keys'
import { invalidateTransactionQueries } from '@/lib/query-invalidation'
import { ErrorNotice } from '@/components/ui/error-notice'
import { cn, formatCurrency } from '@/lib/utils'

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  week: 'Last 7 days',
  month: 'This month',
  all: 'All time',
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
  }, [])

  const handleSearchChange = (value: string, immediate = false) => {
    setSearchInput(value)

    if (searchTimer.current) {
      clearTimeout(searchTimer.current)
      searchTimer.current = null
    }

    if (immediate || value === '') {
      setFilters(previous => ({ ...previous, search: value }))
      return
    }

    searchTimer.current = setTimeout(() => {
      setFilters(previous => ({ ...previous, search: value }))
      searchTimer.current = null
    }, 300)
  }

  const clearFilters = () => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current)
      searchTimer.current = null
    }
    setSearchInput('')
    setFilters(EMPTY_FILTERS)
  }

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
  const hasActiveFilters = Boolean(
    searchInput || filters.accountId || filters.categoryId || filters.range !== 'month',
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and manage your income and expenses</p>
        </div>
        <Button onClick={openAdd} className="h-10 gap-2" disabled={optionsUnavailable}>
          <Plus className="h-4 w-4" /> Add transaction
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

      <section>
        <div className="mb-2 flex items-end justify-between gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Summary</h2>
          <p className="text-xs text-muted-foreground">{RANGE_LABELS[filters.range]}</p>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          <div className="bg-card p-3 sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Income</p>
            </div>
            <p className="font-heading text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-2xl">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="bg-card p-3 sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Expense</p>
            </div>
            <p className="font-heading text-xl font-bold tabular-nums text-red-600 dark:text-red-400 sm:text-2xl">
              {formatCurrency(totalExpense)}
            </p>
          </div>
          <div className="bg-card p-3 sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Net</p>
            </div>
            <p className={cn(
              'font-heading text-xl font-bold tabular-nums sm:text-2xl',
              net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
            )}>
              {net >= 0 ? '+' : ''}{formatCurrency(net)}
            </p>
          </div>
        </div>
      </section>

      <TransactionFiltersBar
        filters={filters}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        onChange={patch => setFilters(previous => ({ ...previous, ...patch }))}
        onToggleAdvanced={() => setShowAdvanced(value => !value)}
        advancedOpen={showAdvanced}
        accounts={accounts}
        categories={categories}
      />

      {deleteMutation.error && !detail && (
        <ErrorNotice error={deleteMutation.error} />
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <TransactionList
          transactions={transactions}
          onAdd={openAdd}
          onInspect={openDetail}
          addDisabled={optionsUnavailable}
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
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
              {transactionsQuery.isFetchingNextPage ? 'Loading...' : 'Load older transactions'}
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
