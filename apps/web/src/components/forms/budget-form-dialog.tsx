'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { format, startOfMonth, startOfYear, subMonths } from 'date-fns'
import { createBudgetSchema, type CreateBudgetInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useZodForm } from '@/lib/forms'
import { cn, formatCurrency } from '@/lib/utils'
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
  const { control, handleSubmit, reset, watch, formState: { errors } } = form
  const categoryId = watch('categoryId')
  const amount = watch('amount')
  const selectedCategory = categories.find(c => c.id === categoryId)
  const color = selectedCategory?.color || '#6366f1'
  const period = budget?.period ?? defaultPeriod
  const previewAmount = Number(amount || 0)

  useEffect(() => {
    if (!open) return
    reset(budget ? { categoryId: budget.category_id, amount: String(budget.amount) } : emptyBudget)
  }, [open, budget, reset])

  const submit = (values: { categoryId: string; amount: string }) => {
    const startDate = budget?.start_date
      ?? (period === 'monthly'
        ? format(startOfMonth(subMonths(new Date(), monthOffset)), 'yyyy-MM-dd')
        : format(startOfYear(new Date()), 'yyyy-MM-dd'))

    onSubmit({ ...values, period, startDate })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="text-lg font-semibold">
            {budget ? 'Edit budget' : 'New budget'}
          </DialogTitle>
          <DialogDescription>
            Set a spending limit for one expense category.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-5 px-5 py-5 sm:px-6">
          <div
            aria-hidden="true"
            className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {selectedCategory?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {selectedCategory?.name || 'Category'}
              </p>
              <p className="text-xs text-muted-foreground">
                {period === 'monthly' ? 'Monthly' : 'Yearly'} budget
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
            <Label htmlFor="budget-category" className="text-sm font-medium">Category</Label>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="budget-category" className="h-9 w-full" aria-invalid={Boolean(errors.categoryId)}>
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color || '#6366f1' }}
                          />
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
            <Label htmlFor="budget-amount" className="text-sm font-medium">Budget amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                Rp
              </span>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput
                    id="budget-amount"
                    className="h-11 pl-9 text-lg font-semibold tabular-nums"
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

          <DialogFooter className="-mx-5 -mb-5 mt-1 flex-row justify-end gap-2 rounded-b-2xl border-t bg-muted/30 px-5 py-4 sm:-mx-6 sm:px-6">
            <Button type="button" variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-9" disabled={isPending}>
              {isPending ? 'Saving...' : budget ? 'Save changes' : 'Add budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
