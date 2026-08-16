'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import {
  addToSavingsGoal, createSavingsGoal, deleteSavingsGoal, listSavingsGoals, updateSavingsGoal,
  type SavingsGoalInput, type SavingsGoalRow as SavingsGoal,
} from '@/lib/api/savings'
import { differenceInDays } from 'date-fns'
import {
  Plus, Edit, Trash2, PiggyBank, Calendar, ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { queryKeys } from '@/lib/query-keys'
import { ErrorNotice } from '@/components/ui/error-notice'
import { SavingsContributeDialog } from '@/components/forms/savings-contribute-dialog'
import { SavingsGoalFormDialog } from '@/components/forms/savings-goal-form-dialog'
import { cn, formatCurrency } from '@/lib/utils'

export default function SavingsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const [addMoneyGoal, setAddMoneyGoal] = useState<SavingsGoal | null>(null)

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
      await queryClient.invalidateQueries({ queryKey: queryKeys.savings.all })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSavingsGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.savings.all }),
  })

  const contributeMutation = useMutation({
    mutationFn: ({ goal, amount }: { goal: SavingsGoal; amount: string }) =>
      addToSavingsGoal(goal, amount),
    onSuccess: async () => {
      setAddMoneyGoal(null)
      await queryClient.invalidateQueries({ queryKey: queryKeys.savings.all })
    },
  })

  const openAddDialog = () => {
    saveMutation.reset()
    setEditingGoal(null)
    setDialogOpen(true)
  }

  const openEditDialog = (g: SavingsGoal) => {
    saveMutation.reset()
    setEditingGoal(g)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this savings goal?')) return
    deleteMutation.reset()
    deleteMutation.mutate(id)
  }

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500'
    if (pct >= 60) return 'bg-blue-500'
    return 'bg-primary'
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Savings Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">Track progress toward your financial targets</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> New Goal
        </Button>
      </div>

      {goalsQuery.isError && (
        <ErrorNotice
          error={goalsQuery.error}
          onRetry={() => goalsQuery.refetch()}
        />
      )}

      {deleteMutation.error && <ErrorNotice error={deleteMutation.error} />}

      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Target</p>
            <p className="text-lg font-heading font-bold tabular-nums">{formatCurrency(totalTarget)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Saved</p>
            <p className="text-lg font-heading font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">Completed</p>
            <p className="text-lg font-heading font-bold">{completedGoals}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                </div>
              </div>
              <div className="h-2 bg-muted animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <PiggyBank className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-heading text-lg font-semibold mb-1">No savings goals yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Set a target and start saving</p>
          <Button onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" /> New Goal
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map(g => {
            const pct = Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
            const isComplete = pct >= 100
            const daysLeft = g.deadline ? differenceInDays(new Date(g.deadline), new Date()) : null
            return (
              <div
                key={g.id}
                className={cn(
                  'rounded-xl border bg-card p-5 transition-all',
                  isComplete ? 'border-emerald-200 dark:border-emerald-900' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: g.color || '#6366f1' }}
                    >
                      {isComplete ? '✓' : g.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{g.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Number(g.current_amount))} / {formatCurrency(Number(g.target_amount))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(g)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(g.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <Progress value={Number(g.current_amount)} max={Number(g.target_amount)} className="h-2" />
                  <div
                    className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-300', getProgressColor(pct))}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
                  {g.deadline && (
                    <span className={cn(
                      'text-xs flex items-center gap-1',
                      daysLeft !== null && daysLeft < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                    )}>
                      <Calendar className="h-3 w-3" />
                      {daysLeft !== null && daysLeft < 0
                        ? `${Math.abs(daysLeft)}d overdue`
                        : `${daysLeft}d left`
                      }
                    </span>
                  )}
                </div>

                {!isComplete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => {
                      contributeMutation.reset()
                      setAddMoneyGoal(g)
                    }}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" /> Add Money
                  </Button>
                )}
                {isComplete && (
                  <div className="text-center py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    Goal Reached!
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

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
        goalName={addMoneyGoal?.name ?? ''}
        onSubmit={values => {
          if (addMoneyGoal) contributeMutation.mutate({ goal: addMoneyGoal, amount: values.amount })
        }}
        isPending={contributeMutation.isPending}
        error={contributeMutation.error}
      />
    </div>
  )
}
