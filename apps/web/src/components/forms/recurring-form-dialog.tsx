'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { format } from 'date-fns'
import { createRecurringSchema, type CreateRecurringInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useZodForm } from '@/lib/forms'
import type { AccountOptionRow as Account } from '@/lib/api/accounts'
import type { CategoryRow as Category } from '@/lib/api/categories'
import type { Frequency, RecurringRow } from '@/lib/api/recurring'
import type { TxType } from '@/types/database'

interface RecurringFormValues {
  accountId: string
  categoryId: string | null
  type: TxType
  amount: string
  description: string | null
  frequency: Frequency
  nextDate: string
}

const EMPTY_FORM: RecurringFormValues = {
  accountId: '',
  categoryId: null,
  type: 'expense',
  amount: '',
  description: null,
  frequency: 'monthly',
  nextDate: format(new Date(), 'yyyy-MM-dd'),
}

function toFormValues(item: RecurringRow | null, defaultAccountId: string): RecurringFormValues {
  if (!item) return { ...EMPTY_FORM, accountId: defaultAccountId }
  return {
    accountId: item.account_id,
    categoryId: item.category_id,
    type: item.type,
    amount: String(item.amount),
    description: item.description,
    frequency: item.frequency,
    nextDate: item.next_date,
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: RecurringRow | null
  accounts: Account[]
  categories: Category[]
  onSubmit: (values: CreateRecurringInput) => void
  isPending: boolean
  error: unknown
}

export function RecurringFormDialog({
  open, onOpenChange, item, accounts, categories, onSubmit, isPending, error,
}: Props) {
  const defaultAccountId = accounts[0]?.id ?? ''
  const form = useZodForm<RecurringFormValues, CreateRecurringInput>(createRecurringSchema, {
    defaultValues: toFormValues(item, defaultAccountId),
  })
  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = form
  const type = watch('type')

  useEffect(() => {
    if (open) reset(toFormValues(item, defaultAccountId))
  }, [open, item, defaultAccountId, reset])

  const filteredCategories = categories.filter(c => c.type === type && c.parent_id === null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="text-lg font-semibold">
            {item ? 'Edit recurring' : 'New recurring'}
          </DialogTitle>
          <DialogDescription>
            Set the amount, account, and schedule for this rule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(values => onSubmit(values))} className="space-y-5 px-5 py-5 sm:px-6">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Tabs
                value={field.value}
                onValueChange={value => {
                  field.onChange(value)
                  setValue('categoryId', null)
                }}
              >
                <TabsList className="h-10 w-full rounded-xl p-1">
                  <TabsTrigger value="expense" className="h-full flex-1">Expense</TabsTrigger>
                  <TabsTrigger value="income" className="h-full flex-1">Income</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          />

          <div className="space-y-2">
            <Label htmlFor="recurring-amount" className="text-sm font-medium">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                Rp
              </span>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput
                    id="recurring-amount"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recurring-account" className="text-sm font-medium">Account</Label>
              <Controller
                control={control}
                name="accountId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="recurring-account" className="h-9 w-full" aria-invalid={Boolean(errors.accountId)}>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError error={errors.accountId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurring-category" className="text-sm font-medium">Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'none'}
                    onValueChange={value => field.onChange(value === 'none' ? null : value)}
                  >
                    <SelectTrigger id="recurring-category" className="h-9 w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="none">No category</SelectItem>
                      {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurring-description" className="text-sm font-medium">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Input
                  id="recurring-description"
                  className="h-9"
                  placeholder="e.g. Monthly salary"
                  value={field.value ?? ''}
                  onChange={event => field.onChange(event.target.value || null)}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recurring-frequency" className="text-sm font-medium">Frequency</Label>
              <Controller
                control={control}
                name="frequency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="recurring-frequency" className="h-9 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-next-date" className="text-sm font-medium">Next date</Label>
              <Input
                id="recurring-next-date"
                type="date"
                className="h-9"
                aria-invalid={Boolean(errors.nextDate)}
                {...register('nextDate')}
              />
              <FieldError error={errors.nextDate} />
            </div>
          </div>

          <ErrorNotice error={error} className="text-xs" />

          <DialogFooter className="-mx-5 -mb-5 mt-1 flex-row justify-end gap-2 rounded-b-2xl border-t bg-muted/30 px-5 py-4 sm:-mx-6 sm:px-6">
            <Button type="button" variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-9" disabled={isPending}>
              {isPending ? 'Saving...' : item ? 'Save changes' : 'Create recurring'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
