'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { format } from 'date-fns'
import { createRecurringSchema, type CreateRecurringInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(values => onSubmit(values))} className="space-y-4 pt-2">
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
                <TabsList className="w-full">
                  <TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger>
                  <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          />

          <div className="space-y-2">
            <Label htmlFor="recurring-amount">Amount (Rp)</Label>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <MoneyInput
                  id="recurring-amount"
                  placeholder="0"
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  aria-invalid={Boolean(errors.amount)}
                />
              )}
            />
            <FieldError error={errors.amount} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Controller
                control={control}
                name="accountId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={Boolean(errors.accountId)}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError error={errors.accountId} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'none'}
                    onValueChange={value => field.onChange(value === 'none' ? null : value)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurring-description">Description</Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Input
                  id="recurring-description"
                  placeholder="e.g. Monthly salary"
                  value={field.value ?? ''}
                  onChange={event => field.onChange(event.target.value || null)}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Controller
                control={control}
                name="frequency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-next-date">Next Date</Label>
              <Input
                id="recurring-next-date"
                type="date"
                aria-invalid={Boolean(errors.nextDate)}
                {...register('nextDate')}
              />
              <FieldError error={errors.nextDate} />
            </div>
          </div>

          <ErrorNotice error={error} className="text-xs" />
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
