'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { PiggyBank } from 'lucide-react'
import { createSavingsGoalSchema, type CreateSavingsGoalInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { cn, formatCurrency } from '@/lib/utils'
import { useZodForm } from '@/lib/forms'
import type { SavingsGoalRow as SavingsGoal } from '@/lib/api/savings'

const COLOR_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

interface SavingsGoalFormValues {
  name: string
  targetAmount: string
  deadline: string | null
  color: string
}

const EMPTY_FORM: SavingsGoalFormValues = {
  name: '',
  targetAmount: '',
  deadline: null,
  color: COLOR_PRESETS[0],
}

function toFormValues(goal: SavingsGoal | null): SavingsGoalFormValues {
  if (!goal) return EMPTY_FORM
  return {
    name: goal.name,
    targetAmount: String(goal.target_amount),
    deadline: goal.deadline,
    color: goal.color || COLOR_PRESETS[0],
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: SavingsGoal | null
  onSubmit: (values: CreateSavingsGoalInput) => void
  isPending: boolean
  error: unknown
}

export function SavingsGoalFormDialog({ open, onOpenChange, goal, onSubmit, isPending, error }: Props) {
  const form = useZodForm<SavingsGoalFormValues, CreateSavingsGoalInput>(createSavingsGoalSchema, {
    defaultValues: toFormValues(goal),
  })
  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = form
  const name = watch('name')
  const targetAmount = watch('targetAmount')
  const color = watch('color')
  const previewAmount = Number(targetAmount || 0)

  useEffect(() => {
    if (open) reset(toFormValues(goal))
  }, [open, goal, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="text-lg font-semibold">
            {goal ? 'Edit goal' : 'New savings goal'}
          </DialogTitle>
          <DialogDescription>
            {goal
              ? 'Update the target, deadline, or color of this goal.'
              : 'Set a target amount and an optional deadline to save toward.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(values => onSubmit(values))} className="space-y-5 px-5 py-5 sm:px-6">
          <div
            aria-hidden="true"
            className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}15`, color }}
            >
              <PiggyBank className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {name.trim() || 'Goal name'}
              </p>
              <p className="text-xs text-muted-foreground">
                {previewAmount > 0 ? 'Target amount' : 'Set a target amount'}
              </p>
            </div>
            <p className={cn(
              'shrink-0 font-heading text-sm font-bold tabular-nums sm:text-base',
              previewAmount > 0 ? 'text-foreground' : 'text-muted-foreground',
            )}>
              {formatCurrency(previewAmount)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-name" className="text-sm font-medium">Goal name</Label>
            <Input
              id="savings-name"
              className="h-9"
              placeholder="e.g. Emergency fund, Vacation"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            <FieldError error={errors.name} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="savings-target" className="text-sm font-medium">Target amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  Rp
                </span>
                <Controller
                  control={control}
                  name="targetAmount"
                  render={({ field }) => (
                    <MoneyInput
                      id="savings-target"
                      className="h-9 pl-9 tabular-nums"
                      placeholder="0"
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      aria-invalid={Boolean(errors.targetAmount)}
                    />
                  )}
                />
              </div>
              <FieldError error={errors.targetAmount} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="savings-deadline" className="text-sm font-medium">
                Deadline <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Controller
                control={control}
                name="deadline"
                render={({ field }) => (
                  <Input
                    id="savings-deadline"
                    type="date"
                    className="h-9"
                    value={field.value ?? ''}
                    onChange={event => field.onChange(event.target.value || null)}
                    onBlur={field.onBlur}
                    name={field.name}
                    aria-invalid={Boolean(errors.deadline)}
                  />
                )}
              />
              <FieldError error={errors.deadline} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Use color ${c}`}
                  aria-pressed={color === c}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    color === c ? 'scale-110 ring-2 ring-current ring-offset-2 ring-offset-background' : 'hover:scale-105',
                  )}
                  style={{ backgroundColor: c, color: c }}
                  onClick={() => setValue('color', c, { shouldValidate: true })}
                />
              ))}
            </div>
          </div>

          <ErrorNotice error={error} className="text-xs" />

          <DialogFooter className="-mx-5 -mb-5 mt-1 flex-row justify-end gap-2 rounded-b-2xl border-t bg-muted/30 px-5 py-4 sm:-mx-6 sm:px-6">
            <Button type="button" variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-9" disabled={isPending}>
              {isPending ? 'Saving...' : goal ? 'Save changes' : 'Create goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
