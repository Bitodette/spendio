'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { format, startOfMonth, startOfYear, subMonths } from 'date-fns'
import { createBudgetSchema, type CreateBudgetInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useZodForm } from '@/lib/forms'
import type { CategoryRow } from '@/lib/api/categories'
import type { BudgetWithSpent } from '@/lib/api/budgets'

const budgetFormSchema = createBudgetSchema.pick({ categoryId: true, amount: true })

interface BudgetFormValues {
  categoryId: string
  amount: string
}

const emptyBudget: BudgetFormValues = {
  categoryId: '',
  amount: '',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget: BudgetWithSpent | null
  defaultPeriod: 'monthly' | 'yearly'
  monthOffset: number
  categories: CategoryRow[]
  onSubmit: (values: CreateBudgetInput) => void
  isPending: boolean
  error: unknown
}

export function BudgetFormDialog({
  open, onOpenChange, budget, defaultPeriod, monthOffset, categories, onSubmit, isPending, error,
}: Props) {
  const form = useZodForm<BudgetFormValues, { categoryId: string; amount: string }>(budgetFormSchema, {
    defaultValues: budget ? { categoryId: budget.category_id, amount: String(budget.amount) } : emptyBudget,
  })
  const { control, handleSubmit, reset, formState: { errors } } = form

  useEffect(() => {
    if (!open) return
    reset(budget ? { categoryId: budget.category_id, amount: String(budget.amount) } : emptyBudget)
  }, [open, budget, reset])

  const submit = (values: { categoryId: string; amount: string }) => {
    const period = budget?.period ?? defaultPeriod
    const startDate = budget?.start_date
      ?? (period === 'monthly'
        ? format(startOfMonth(subMonths(new Date(), monthOffset)), 'yyyy-MM-dd')
        : format(startOfYear(new Date()), 'yyyy-MM-dd'))

    onSubmit({ ...values, period, startDate })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{budget ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={Boolean(errors.categoryId)}>
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#6366f1' }} />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError error={errors.categoryId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-amount" className="text-sm font-medium">Budget Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput
                    id="budget-amount"
                    className="pl-9"
                    placeholder="0"
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
              {isPending ? 'Saving...' : budget ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
