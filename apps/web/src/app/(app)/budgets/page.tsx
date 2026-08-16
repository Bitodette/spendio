'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import {
  createBudget, deleteBudget, listBudgetsWithSpending, updateBudget,
  type BudgetInput, type BudgetWithSpent,
} from '@/lib/api/budgets'
import { listExpenseCategories } from '@/lib/api/categories'
import { format, subMonths } from 'date-fns'
import {
  Target, Plus, Edit, Trash2, AlertTriangle, TrendingUp, TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { queryKeys } from '@/lib/query-keys'
import { ErrorNotice } from '@/components/ui/error-notice'
import { BudgetFormDialog } from '@/components/forms/budget-form-dialog'
import { cn, formatCurrency } from '@/lib/utils'

export default function BudgetsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null)
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [monthOffset, setMonthOffset] = useState(0)

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
      await queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all }),
  })

  const openAddDialog = () => {
    saveMutation.reset()
    setEditingBudget(null)
    setDialogOpen(true)
  }

  const openEditDialog = (b: BudgetWithSpent) => {
    saveMutation.reset()
    setEditingBudget(b)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this budget?')) return
    deleteMutation.reset()
    deleteMutation.mutate(id)
  }

  const getBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-red-500'
    if (pct >= 80) return 'bg-amber-500'
    return 'bg-emerald-500'
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
  const overBudgetCount = budgets.filter(b => b.percentage >= 100).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-1">Track spending against your limits</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2 shrink-0" disabled={categoriesUnavailable}>
          <Plus className="h-4 w-4" /> Add Budget
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

      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-border p-0.5 bg-muted/50">
          <button
            onClick={() => setPeriod('monthly')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
              period === 'monthly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
              period === 'yearly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Yearly
          </button>
        </div>
        {period === 'monthly' && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setMonthOffset(prev => prev + 1)}
            >
              <TrendingDown className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">{periodLabel}</span>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setMonthOffset(prev => Math.max(0, prev - 1))}
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
            <p className="text-lg font-heading font-bold tabular-nums">{formatCurrency(totalBudget)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Spent</p>
            <p className="text-lg font-heading font-bold tabular-nums">{formatCurrency(totalSpent)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Over Budget</p>
            <p className={cn('text-lg font-heading font-bold', overBudgetCount > 0 ? 'text-red-600 dark:text-red-400' : '')}>
              {overBudgetCount}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-muted animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Target className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-heading text-lg font-semibold mb-1">No budgets yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Set spending limits for your categories</p>
          <Button onClick={openAddDialog} className="gap-2" disabled={categoriesUnavailable}>
            <Plus className="h-4 w-4" /> Add Budget
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map(b => {
            const isOver = b.percentage >= 100
            return (
              <div
                key={b.id}
                className={cn(
                  'rounded-xl border bg-card p-5 transition-all',
                  isOver ? 'border-red-200 dark:border-red-900' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                      style={{ backgroundColor: b.category?.color || '#6366f1' }}
                    >
                      {b.category?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{b.category?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(b.spent)} / {formatCurrency(Number(b.amount))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isOver && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 px-2 py-0.5 text-[10px] font-semibold">
                        <AlertTriangle className="h-2.5 w-2.5" /> Over
                      </span>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(b)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={b.spent} max={Number(b.amount)} className="h-2" />
                  <div
                    className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-300', getBarColor(b.percentage))}
                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{b.percentage}% used</span>
                  <span className={cn('text-xs font-medium', isOver ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                    {isOver ? `${formatCurrency(Math.abs(b.remaining))} over` : `${formatCurrency(b.remaining)} left`}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
