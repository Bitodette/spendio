'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { PiggyBank } from 'lucide-react'
import { contributeSavingsGoalSchema, type ContributeSavingsGoalInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Progress } from '@/components/ui/progress'
import { cn, formatCurrency } from '@/lib/utils'
import { useZodForm } from '@/lib/forms'
import type { SavingsGoalRow as SavingsGoal } from '@/lib/api/savings'

interface ContributeFormValues {
  amount: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: SavingsGoal | null
  onSubmit: (values: ContributeSavingsGoalInput) => void
  isPending: boolean
  error: unknown
}

export function SavingsContributeDialog({ open, onOpenChange, goal, onSubmit, isPending, error }: Props) {
  const form = useZodForm<ContributeFormValues, ContributeSavingsGoalInput>(contributeSavingsGoalSchema, {
    defaultValues: { amount: '' },
  })
  const { control, handleSubmit, reset, watch, formState: { errors } } = form
  const amount = watch('amount')

  useEffect(() => {
    if (open) reset({ amount: '' })
  }, [open, reset])

  const target = Number(goal?.target_amount ?? 0)
  const current = Number(goal?.current_amount ?? 0)
  const color = goal?.color || '#6366f1'
  const newTotal = current + Number(amount || 0)
  const newPct = target > 0 ? Math.min(Math.round((newTotal / target) * 100), 100) : 0
  const remaining = Math.max(target - newTotal, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="text-lg font-semibold">Add money</DialogTitle>
          <DialogDescription>
            {goal ? `Put money aside for ${goal.name}.` : 'Put money aside for this goal.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(values => onSubmit(values))} className="space-y-5 px-5 py-5 sm:px-6">
          {goal && (
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${color}15`, color }}
                    aria-hidden="true"
                  >
                    <PiggyBank className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{goal.name}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(current)} saved
                    </p>
                  </div>
                </div>
                <p className="shrink-0 font-heading text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(target)}
                </p>
              </div>
              <Progress
                value={newTotal}
                max={target}
                className="mt-3 h-1.5"
                indicatorClassName={cn(newPct >= 100 ? 'bg-emerald-500' : 'bg-primary')}
              />
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] tabular-nums text-muted-foreground">
                <span>{newPct}% after this</span>
                <span>{remaining > 0 ? `${formatCurrency(remaining)} to go` : 'Goal reached'}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="contribute-amount" className="text-sm font-medium">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                Rp
              </span>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput
                    id="contribute-amount"
                    className="h-11 pl-9 text-lg font-semibold tabular-nums"
                    placeholder="0"
                    autoFocus
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    aria-invalid={Boolean(errors.amount)}
                  />
                )}
              />
            </div>
            <FieldError error={errors.amount} />
          </div>

          <ErrorNotice error={error} className="text-xs" />

          <DialogFooter className="-mx-5 -mb-5 mt-1 flex-row justify-end gap-2 rounded-b-2xl border-t bg-muted/30 px-5 py-4 sm:-mx-6 sm:px-6">
            <Button type="button" variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-9" disabled={isPending}>
              {isPending ? 'Adding...' : 'Add money'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
