'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { contributeSavingsGoalSchema, type ContributeSavingsGoalInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { useZodForm } from '@/lib/forms'

interface ContributeFormValues {
  amount: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  goalName: string
  onSubmit: (values: ContributeSavingsGoalInput) => void
  isPending: boolean
  error: unknown
}

export function SavingsContributeDialog({ open, onOpenChange, goalName, onSubmit, isPending, error }: Props) {
  const form = useZodForm<ContributeFormValues, ContributeSavingsGoalInput>(contributeSavingsGoalSchema, {
    defaultValues: { amount: '' },
  })
  const { control, handleSubmit, reset, formState: { errors } } = form

  useEffect(() => {
    if (open) reset({ amount: '' })
  }, [open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Money to {goalName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(values => onSubmit(values))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contribute-amount" className="text-sm font-medium">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput
                    id="contribute-amount"
                    className="pl-9"
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
