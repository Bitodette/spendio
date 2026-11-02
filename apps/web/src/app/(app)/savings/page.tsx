'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { differenceInDays } from 'date-fns'
import {
  Calendar, Check, Pencil, PiggyBank, Plus, Trash2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import {
  addToSavingsGoal, createSavingsGoal, deleteSavingsGoal, listSavingsGoals, updateSavingsGoal,
  type SavingsGoalInput, type SavingsGoalRow as SavingsGoal,
} from '@/lib/api/savings'
import { queryKeys } from '@/lib/query-keys'
import { Button } from '@/components/ui/button'
import { ErrorNotice } from '@/components/ui/error-notice'
import { InlineConfirm } from '@/components/ui/inline-confirm'
import { Progress } from '@/components/ui/progress'
import { SuccessNotice } from '@/components/ui/success-notice'
import { SavingsContributeDialog } from '@/components/forms/savings-contribute-dialog'
import { SavingsGoalFormDialog } from '@/components/forms/savings-goal-form-dialog'
import { cn, formatCurrency } from '@/lib/utils'

export default function SavingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const [addMoneyGoal, setAddMoneyGoal] = useState<SavingsGoal | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  const goalsQuery = useQuery({
    queryKey: queryKeys.savings.list,
    queryFn: listSavingsGoals,
    enabled: Boolean(user),
  })
  const goals = goalsQuery.data ?? []
  const loading = goalsQuery.isPending

  const saveMutation = useMutation({
    mutationFn: async (input: SavingsGoalInput) => {
      if (editingGoal) {
        await updateSavingsGoal(editingGoal.id, input)
      } else {
        await createSavingsGoal(input)
      }
    },
    onSuccess: async () => {
      setDialogOpen(false)
      setNotice(editingGoal ? 'Goal updated' : 'Goal created')
      await queryClient.invalidateQueries({ queryKey: queryKeys.savings.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSavingsGoal,
    onSuccess: async () => {
      setConfirmingId(null)
      setNotice('Goal deleted')
      await queryClient.invalidateQueries({ queryKey: queryKeys.savings.all })
    },
  })

  const contributeMutation = useMutation({
    mutationFn: ({ goal, amount }: { goal: SavingsGoal; amount: string }) =>
      addToSavingsGoal(goal, amount),
    onSuccess: async (_data, variables) => {
      setNotice(`Money added to ${variables.goal.name}`)
      setAddMoneyGoal(null)
      await queryClient.invalidateQueries({ queryKey: queryKeys.savings.all })
    },
  })

  const openAddDialog = () => {
    saveMutation.reset()
    deleteMutation.reset()
    setConfirmingId(null)
    setEditingGoal(null)
    setDialogOpen(true)
  }

  const openEditDialog = (g: SavingsGoal) => {
    saveMutation.reset()
    deleteMutation.reset()
    setConfirmingId(null)
    setEditingGoal(g)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteMutation.reset()
    deleteMutation.mutate(id)
  }

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500'
    if (pct >= 60) return 'bg-blue-500'
    return 'bg-primary'
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 h-9 w-56 animate-pulse rounded bg-muted" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="bg-card p-5">
              <div className="mb-2 h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-7 w-28 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map(item => (
            <div key={item} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-44 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-2 animate-pulse rounded-full bg-muted" />
              <div className="mt-4 h-9 animate-pulse rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (goalsQuery.isError && !goalsQuery.data) {
    return (
      <ErrorNotice
        error={goalsQuery.error}
        onRetry={() => goalsQuery.refetch()}
      />
    )
  }

  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0)
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0)
  const completedGoals = goals.filter(g => Number(g.current_amount) >= Number(g.target_amount)).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Savings goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track progress toward your financial targets</p>
        </div>
        <Button onClick={openAddDialog} className="h-10 gap-2">
          <Plus className="h-4 w-4" /> New goal
        </Button>
      </div>

      {goalsQuery.isError && (
        <ErrorNotice
          error={goalsQuery.error}
          onRetry={() => goalsQuery.refetch()}
        />
      )}

      {deleteMutation.error && <ErrorNotice error={deleteMutation.error} />}

      <SuccessNotice message={notice} />

      {goals.length > 0 && (
        <section>
          <div className="mb-2 flex items-end justify-between gap-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Overview
            </h2>
            <p className="text-xs text-muted-foreground">
              {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
            <div className="bg-card p-3 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <PiggyBank className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total target</p>
              </div>
              <p className="font-heading text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {formatCurrency(totalTarget)}
              </p>
            </div>
            <div className="bg-card p-3 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <Plus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Saved</p>
              </div>
              <p className="font-heading text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 sm:text-2xl">
                {formatCurrency(totalSaved)}
              </p>
            </div>
            <div className="bg-card p-3 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completed</p>
              </div>
              <p className="font-heading text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                {completedGoals}
              </p>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your goals
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Add money whenever you make progress toward a goal.
          </p>
        </div>

        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <PiggyBank className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No savings goals yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Set a target and start putting money aside for what matters.
            </p>
            <Button onClick={openAddDialog} variant="outline" size="sm" className="mt-4 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New goal
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map(g => {
              const target = Number(g.target_amount)
              const current = Number(g.current_amount)
              const pct = target > 0 ? Math.round((current / target) * 100) : 0
              const isComplete = target > 0 && current >= target
              const daysLeft = g.deadline ? differenceInDays(new Date(g.deadline), new Date()) : null
              const isConfirming = confirmingId === g.id
              const color = g.color || '#6366f1'

              const deadlineLabel = daysLeft === null
                ? null
                : daysLeft < 0
                  ? `${Math.abs(daysLeft)}d overdue`
                  : daysLeft === 0
                    ? 'Due today'
                    : `${daysLeft}d left`

              return (
                <div
                  key={g.id}
                  className={cn(
                    'rounded-xl border bg-card p-4 transition-colors sm:p-5',
                    isComplete ? 'border-emerald-200 dark:border-emerald-900/60' : 'border-border',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          isComplete && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
                        )}
                        style={isComplete ? undefined : { backgroundColor: `${color}15`, color }}
                        aria-hidden="true"
                      >
                        {isComplete
                          ? <Check className="h-5 w-5" />
                          : <PiggyBank className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-foreground">{g.name}</p>
                          {isComplete && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              Completed
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          {formatCurrency(current)} of {formatCurrency(target)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 sm:h-8 sm:w-8"
                        aria-label={`Edit ${g.name}`}
                        title="Edit"
                        onClick={() => openEditDialog(g)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:h-8 sm:w-8"
                        aria-label={`Delete ${g.name}`}
                        title="Delete"
                        onClick={() => {
                          deleteMutation.reset()
                          setConfirmingId(g.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Progress
                      value={current}
                      max={target}
                      className="h-2"
                      indicatorClassName={getProgressColor(pct)}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                    {deadlineLabel && (
                      <span className={cn(
                        'flex items-center gap-1 text-xs',
                        daysLeft !== null && daysLeft < 0
                          ? 'text-red-600 dark:text-red-400'
                          : daysLeft === 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground',
                      )}>
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {deadlineLabel}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    {isComplete ? (
                      <div className="rounded-lg bg-emerald-50 py-2 text-center text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Goal reached
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-9 w-full gap-2"
                        onClick={() => {
                          contributeMutation.reset()
                          setAddMoneyGoal(g)
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add money
                      </Button>
                    )}
                  </div>

                  {isConfirming && (
                    <InlineConfirm
                      className="mt-3"
                      title={`Delete “${g.name}”?`}
                      description="The goal and its saved amount will be removed. This can’t be undone."
                      onCancel={() => setConfirmingId(null)}
                      onConfirm={() => handleDelete(g.id)}
                      isPending={deleteMutation.isPending && deleteMutation.variables === g.id}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <SavingsGoalFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) saveMutation.reset()
        }}
        goal={editingGoal}
        onSubmit={values => saveMutation.mutate(values)}
        isPending={saveMutation.isPending}
        error={saveMutation.error}
      />

      <SavingsContributeDialog
        open={Boolean(addMoneyGoal)}
        onOpenChange={open => {
          if (!open) {
            contributeMutation.reset()
            setAddMoneyGoal(null)
          }
        }}
        goal={addMoneyGoal}
        onSubmit={values => {
          if (addMoneyGoal) contributeMutation.mutate({ goal: addMoneyGoal, amount: values.amount })
        }}
        isPending={contributeMutation.isPending}
        error={contributeMutation.error}
      />
    </div>
  )
}
