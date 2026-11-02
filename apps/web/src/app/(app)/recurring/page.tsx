'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import {
  Pause, Pencil, Play, Plus, Repeat, Trash2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import {
  createRecurring, deleteRecurring, listRecurring, postDueRecurring,
  setRecurringActive, updateRecurring, type RecurringInput, type RecurringRow,
} from '@/lib/api/recurring'
import { listAccountOptions, type AccountOptionRow } from '@/lib/api/accounts'
import { listCategories, type CategoryRow } from '@/lib/api/categories'
import { queryKeys } from '@/lib/query-keys'
import { invalidateRecurringQueries } from '@/lib/query-invalidation'
import { Button } from '@/components/ui/button'
import { ErrorNotice } from '@/components/ui/error-notice'
import { InlineConfirm } from '@/components/ui/inline-confirm'
import { SuccessNotice } from '@/components/ui/success-notice'
import { RecurringFormDialog } from '@/components/forms/recurring-form-dialog'
import { cn, formatCurrency } from '@/lib/utils'

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

export default function RecurringPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringRow | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const generatedRef = useRef(false)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  const itemsQuery = useQuery({
    queryKey: queryKeys.recurring.list,
    queryFn: listRecurring,
    enabled: Boolean(user),
  })
  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts.options,
    queryFn: listAccountOptions,
    enabled: Boolean(user),
  })
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list,
    queryFn: listCategories,
    enabled: Boolean(user),
  })
  const items = itemsQuery.data ?? []
  const accounts: AccountOptionRow[] = accountsQuery.data ?? []
  const categories: CategoryRow[] = categoriesQuery.data ?? []
  const optionsUnavailable =
    (accountsQuery.isError && !accountsQuery.data) ||
    (categoriesQuery.isError && !categoriesQuery.data)
  const loading = itemsQuery.isPending || accountsQuery.isPending || categoriesQuery.isPending

  const saveMutation = useMutation({
    mutationFn: async (input: RecurringInput) => {
      if (editing) {
        await updateRecurring(editing.id, input)
      } else {
        await createRecurring(input)
      }
    },
    onSuccess: async () => {
      setDialogOpen(false)
      setNotice(editing ? 'Recurring transaction updated' : 'Recurring transaction created')
      await invalidateRecurringQueries(queryClient)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: async () => {
      setConfirmingId(null)
      setNotice('Recurring transaction deleted')
      await invalidateRecurringQueries(queryClient)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setRecurringActive(id, isActive),
    onSuccess: async (_data, variables) => {
      setNotice(variables.isActive ? 'Recurring transaction resumed' : 'Recurring transaction paused')
      await invalidateRecurringQueries(queryClient)
    },
  })

  const generateMutation = useMutation({
    mutationFn: async (due: RecurringRow[]) => {
      await postDueRecurring(due)
    },
    onSettled: () => invalidateRecurringQueries(queryClient),
  })
  const generateDue = generateMutation.mutate

  useEffect(() => {
    const allItems = itemsQuery.data
    if (!allItems || generatedRef.current) return
    generatedRef.current = true

    const today = format(new Date(), 'yyyy-MM-dd')
    const due = allItems.filter(i => i.is_active && i.next_date <= today)
    if (due.length) generateDue(due)
  }, [itemsQuery.data, generateDue])

  function openCreate() {
    saveMutation.reset()
    deleteMutation.reset()
    setConfirmingId(null)
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(item: RecurringRow) {
    saveMutation.reset()
    deleteMutation.reset()
    setConfirmingId(null)
    setEditing(item)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    deleteMutation.reset()
    deleteMutation.mutate(id)
  }

  function toggleActive(item: RecurringRow) {
    toggleMutation.reset()
    toggleMutation.mutate({ id: item.id, isActive: !item.is_active })
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 h-9 w-64 animate-pulse rounded bg-muted" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="bg-card p-5">
              <div className="mb-2 h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-7 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-56 max-w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (itemsQuery.isError && !itemsQuery.data) {
    return (
      <ErrorNotice
        error={itemsQuery.error}
        onRetry={() => itemsQuery.refetch()}
      />
    )
  }

  const activeCount = items.filter(i => i.is_active).length
  const pausedCount = items.length - activeCount
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Recurring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Automate bills and income that repeat on a schedule
            {generateMutation.isPending && (
              <span className="ml-2 text-primary">· Generating due transactions…</span>
            )}
          </p>
        </div>
        <Button onClick={openCreate} className="h-10 gap-2" disabled={optionsUnavailable}>
          <Plus className="h-4 w-4" /> New recurring
        </Button>
      </div>

      {(itemsQuery.isError || accountsQuery.isError || categoriesQuery.isError) && (
        <ErrorNotice
          error={itemsQuery.error ?? accountsQuery.error ?? categoriesQuery.error}
          onRetry={() => {
            void itemsQuery.refetch()
            void accountsQuery.refetch()
            void categoriesQuery.refetch()
          }}
        />
      )}

      {(deleteMutation.error || toggleMutation.error || generateMutation.error) && (
        <ErrorNotice
          error={deleteMutation.error ?? toggleMutation.error ?? generateMutation.error}
        />
      )}

      <SuccessNotice message={notice} />

      <section>
        <div className="mb-2 flex items-end justify-between gap-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Overview
          </h2>
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? 'rule' : 'rules'}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          <div className="bg-card p-3 sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active</p>
            </div>
            <p className="font-heading text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-2xl">
              {activeCount}
            </p>
          </div>
          <div className="bg-card p-3 sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <Pause className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Paused</p>
            </div>
            <p className="font-heading text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              {pausedCount}
            </p>
          </div>
          <div className="bg-card p-3 sm:p-5">
            <div className="mb-2 flex items-center gap-2">
              <Repeat className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</p>
            </div>
            <p className="font-heading text-xl font-bold tabular-nums text-foreground sm:text-2xl">
              {items.length}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your recurring transactions
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Pause a rule to stop it without losing its schedule.
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <Repeat className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No recurring transactions yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Set up a rule for rent, subscriptions, or salary and let Spendio record it for you.
            </p>
            <Button
              onClick={openCreate}
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5"
              disabled={optionsUnavailable}
            >
              <Plus className="h-3.5 w-3.5" /> New recurring
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const acc = accounts.find(a => a.id === item.account_id)
              const cat = categories.find(c => c.id === item.category_id)
              const title = item.description?.trim() || cat?.name || 'Recurring transaction'
              const isDue = item.is_active && item.next_date <= today
              const isConfirming = confirmingId === item.id
              const isToggling = toggleMutation.isPending && toggleMutation.variables?.id === item.id

              return (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-xl border bg-card p-4 transition-colors sm:p-5',
                    item.is_active ? 'border-border' : 'border-dashed bg-muted/20',
                  )}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        item.is_active
                          ? item.type === 'expense'
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'bg-muted text-muted-foreground',
                      )}>
                        <Repeat className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className={cn(
                            'truncate text-sm font-medium',
                            item.is_active ? 'text-foreground' : 'text-muted-foreground',
                          )}>
                            {title}
                          </p>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {FREQUENCY_LABELS[item.frequency]}
                          </span>
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium',
                            item.is_active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground',
                          )}>
                            {item.is_active ? 'Active' : 'Paused'}
                          </span>
                          {isDue && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                              Due
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {acc?.name || 'Unknown account'}
                          {cat ? ` · ${cat.name}` : ''}
                          {` · Next ${format(parseISO(item.next_date), 'd MMM yyyy')}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <p className={cn(
                        'shrink-0 text-sm font-semibold tabular-nums',
                        item.is_active
                          ? item.type === 'expense'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground',
                      )}>
                        {item.type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}
                      </p>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 sm:h-8 sm:w-8"
                          aria-label={item.is_active ? `Pause ${title}` : `Resume ${title}`}
                          title={item.is_active ? 'Pause' : 'Resume'}
                          onClick={() => toggleActive(item)}
                          disabled={isToggling}
                        >
                          {item.is_active
                            ? <Pause className="h-3.5 w-3.5" />
                            : <Play className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 sm:h-8 sm:w-8"
                          aria-label={`Edit ${title}`}
                          title="Edit"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:h-8 sm:w-8"
                          aria-label={`Delete ${title}`}
                          title="Delete"
                          onClick={() => {
                            deleteMutation.reset()
                            setConfirmingId(item.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {isConfirming && (
                    <InlineConfirm
                      className="mt-3"
                      title={`Delete “${title}”?`}
                      description="Future transactions will no longer be generated. Transactions already posted are kept."
                      onCancel={() => setConfirmingId(null)}
                      onConfirm={() => handleDelete(item.id)}
                      isPending={deleteMutation.isPending && deleteMutation.variables === item.id}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <RecurringFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) saveMutation.reset()
        }}
        item={editing}
        accounts={accounts}
        categories={categories}
        onSubmit={values => saveMutation.mutate(values)}
        isPending={saveMutation.isPending}
        error={saveMutation.error}
      />
    </div>
  )
}
