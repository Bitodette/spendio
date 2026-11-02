'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, subMonths } from 'date-fns'
import {
  AlertTriangle, ChevronLeft, ChevronRight, Pencil, Plus, Target, Trash2, TrendingDown, TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import {
  createBudget, deleteBudget, listBudgetsWithSpending, updateBudget,
  type BudgetInput, type BudgetWithSpent,
} from '@/lib/api/budgets'
import { listExpenseCategories } from '@/lib/api/categories'
import { queryKeys } from '@/lib/query-keys'
import { Button } from '@/components/ui/button'
import { ErrorNotice } from '@/components/ui/error-notice'
import { InlineConfirm } from '@/components/ui/inline-confirm'
import { Progress } from '@/components/ui/progress'
import { SuccessNotice } from '@/components/ui/success-notice'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BudgetFormDialog } from '@/components/forms/budget-form-dialog'
import { cn, formatCurrency } from '@/lib/utils'

export default function BudgetsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [monthOffset, setMonthOffset] = useState(0)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  const periodLabel = period === 'monthly'
    ? format(subMonths(new Date(), monthOffset), 'MMMM yyyy')
    : format(new Date(), 'yyyy')

  const budgetsQuery = useQuery({
    queryKey: queryKeys.budgets.list(period, monthOffset),
    queryFn: () => listBudgetsWithSpending(period, monthOffset),
    enabled: Boolean(user),
  })
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.expense,
    queryFn: listExpenseCategories,
    enabled: Boolean(user),
  })
  const budgets = budgetsQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const categoriesUnavailable = categoriesQuery.isError && !categoriesQuery.data
  const loading = budgetsQuery.isPending || categoriesQuery.isPending

  const saveMutation = useMutation({
    mutationFn: async (input: BudgetInput) => {
      if (editingBudget) {
        await updateBudget(editingBudget.id, input)
      } else {
        await createBudget(input)
      }
    },
    onSuccess: async () => {
      setDialogOpen(false)
      setNotice(editingBudget ? 'Budget updated' : 'Budget added')
      await queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: async () => {
      setConfirmingId(null)
      setNotice('Budget deleted')
      await queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
    },
  })

  const openAddDialog = () => {
    saveMutation.reset()
    deleteMutation.reset()
    setConfirmingId(null)
    setEditingBudget(null)
    setDialogOpen(true)
  }

  const openEditDialog = (b: BudgetWithSpent) => {
    saveMutation.reset()
    deleteMutation.reset()
    setConfirmingId(null)
    setEditingBudget(b)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteMutation.reset()
    deleteMutation.mutate(id)
  }

  const getBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-red-500'
    if (pct >= 80) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 h-9 w-44 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 max-w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="bg-card p-5">
              <div className="mb-2 h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-7 w-28 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-2 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (budgetsQuery.isError && !budgetsQuery.data) {
    return (
      <ErrorNotice
        error={budgetsQuery.error}
        onRetry={() => budgetsQuery.refetch()}
      />
    )
  }

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalRemaining = totalBudget - totalSpent
  const overBudgetCount = budgets.filter(b => b.percentage >= 100).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Budgets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track spending against your limits</p>
        </div>
        <Button onClick={openAddDialog} className="h-10 gap-2" disabled={categoriesUnavailable}>
          <Plus className="h-4 w-4" /> Add budget
        </Button>
      </div>

      {(budgetsQuery.isError || categoriesQuery.isError) && (
        <ErrorNotice
          error={budgetsQuery.error ?? categoriesQuery.error}
          onRetry={() => {
            void budgetsQuery.refetch()
            void categoriesQuery.refetch()
          }}
        />
      )}

      {deleteMutation.error && <ErrorNotice error={deleteMutation.error} />}

      <SuccessNotice message={notice} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={period} onValueChange={value => setPeriod(value as 'monthly' | 'yearly')}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="monthly" className="flex-1 sm:flex-none">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="flex-1 sm:flex-none">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>

        {period === 'monthly' && (
          <div className="flex items-center gap-1 self-start rounded-lg border border-border bg-card p-1 sm:self-auto">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMonthOffset(previous => Math.min(24, previous + 1))}
              disabled={monthOffset >= 24}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[7.5rem] text-center text-sm font-medium" aria-live="polite">
              {periodLabel}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMonthOffset(previous => Math.max(0, previous - 1))}
              disabled={monthOffset === 0}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {budgets.length > 0 && (
        <section>
          <div className="mb-2 flex items-end justify-between gap-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Summary
            </h2>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            <div className="bg-card p-3 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total budget</p>
              </div>
              <p className="font-heading text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {formatCurrency(totalBudget)}
              </p>
            </div>
            <div className="bg-card p-3 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-red-600 dark:text-red-400" aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Spent</p>
              </div>
              <p className="font-heading text-xl font-bold tabular-nums text-red-600 dark:text-red-400 sm:text-2xl">
                {formatCurrency(totalSpent)}
              </p>
            </div>
            <div className="bg-card p-3 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <TrendingDown
                  className={cn(
                    'h-3.5 w-3.5',
                    totalRemaining < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400',
                  )}
                  aria-hidden="true"
                />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Remaining</p>
              </div>
              <p className={cn(
                'font-heading text-xl font-bold tabular-nums sm:text-2xl',
                totalRemaining < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400',
              )}>
                {formatCurrency(totalRemaining)}
              </p>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your budgets
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Limits for {periodLabel}
            </p>
          </div>
          {overBudgetCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
              <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
              {overBudgetCount} over budget
            </span>
          )}
        </div>

        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No budgets yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Set a spending limit for a category and track how much is left.
            </p>
            <Button
              onClick={openAddDialog}
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5"
              disabled={categoriesUnavailable}
            >
              <Plus className="h-3.5 w-3.5" /> Add budget
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map(b => {
              const isOver = b.percentage >= 100
              const isConfirming = confirmingId === b.id
              const color = b.category?.color || '#6366f1'

              return (
                <div
                  key={b.id}
                  className={cn(
                    'rounded-xl border bg-card p-4 transition-colors sm:p-5',
                    isOver ? 'border-red-200 dark:border-red-900/60' : 'border-border',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold"
                        style={{ backgroundColor: `${color}15`, color }}
                        aria-hidden="true"
                      >
                        {b.category?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-foreground">
                            {b.category?.name || 'Unknown category'}
                          </p>
                          {isOver && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                              <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                              Over
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          {formatCurrency(b.spent)} of {formatCurrency(Number(b.amount))}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 sm:h-8 sm:w-8"
                        aria-label={`Edit budget for ${b.category?.name || 'category'}`}
                        title="Edit"
                        onClick={() => openEditDialog(b)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:h-8 sm:w-8"
                        aria-label={`Delete budget for ${b.category?.name || 'category'}`}
                        title="Delete"
                        onClick={() => {
                          deleteMutation.reset()
                          setConfirmingId(b.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Progress
                      value={b.spent}
                      max={Number(b.amount)}
                      className="h-2"
                      indicatorClassName={getBarColor(b.percentage)}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {Math.round(b.percentage)}% used
                    </span>
                    <span className={cn(
                      'text-xs font-medium tabular-nums',
                      isOver ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
                    )}>
                      {isOver
                        ? `${formatCurrency(Math.abs(b.remaining))} over`
                        : `${formatCurrency(b.remaining)} left`}
                    </span>
                  </div>

                  {isConfirming && (
                    <InlineConfirm
                      className="mt-3"
                      title={`Delete the ${b.category?.name || ''} budget?`}
                      description="Your spending history stays the same; only the limit is removed."
                      onCancel={() => setConfirmingId(null)}
                      onConfirm={() => handleDelete(b.id)}
                      isPending={deleteMutation.isPending && deleteMutation.variables === b.id}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) saveMutation.reset()
        }}
        budget={editingBudget}
        defaultPeriod={period}
        monthOffset={monthOffset}
        categories={categories}
        onSubmit={values => saveMutation.mutate(values)}
        isPending={saveMutation.isPending}
        error={saveMutation.error}
      />
    </div>
  )
}
