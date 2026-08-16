'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { createSavingsGoalSchema, type CreateSavingsGoalInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { cn } from '@/lib/utils'
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
  const color = watch('color')

  useEffect(() => {
    if (open) reset(toFormValues(goal))
  }, [open, goal, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'New Savings Goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(values => onSubmit(values))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="savings-name" className="text-sm font-medium">Goal Name</Label>
            <Input
              id="savings-name"
              placeholder="e.g. Emergency Fund, Vacation"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            <FieldError error={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-target" className="text-sm font-medium">Target Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
              <Controller
                control={control}
                name="targetAmount"
                render={({ field }) => (
                  <MoneyInput
                    id="savings-target"
                    className="pl-9"
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
              Deadline <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Controller
              control={control}
              name="deadline"
              render={({ field }) => (
                <Input
                  id="savings-deadline"
                  type="date"
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
                    'h-7 w-7 rounded-full transition-all',
                    color === c ? 'ring-2 ring-offset-2 ring-current scale-110' : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: c, color: c }}
                  onClick={() => setValue('color', c, { shouldValidate: true })}
                />
              ))}
            </div>
          </div>

          <ErrorNotice error={error} className="text-xs" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : goal ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
