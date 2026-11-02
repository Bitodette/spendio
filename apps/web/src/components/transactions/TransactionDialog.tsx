'use client'

import { Fragment, useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { createTransactionSchema, type CreateTransactionInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth'
import { useZodForm } from '@/lib/forms'
import { invalidateTransactionQueries } from '@/lib/query-invalidation'
import {
  createTransaction, updateTransaction,
  type AccountOption, type Transaction,
} from '@/lib/api/transactions'
import type { CategoryRef, TxType } from '@/types/database'

interface TransactionFormValues {
  accountId: string
  categoryId: string | null
  type: TxType
  amount: string
  description: string | null
  date: string
}

function toFormValues(transaction: Transaction | null, defaultAccountId: string): TransactionFormValues {
  if (!transaction) {
    return {
      accountId: defaultAccountId,
      categoryId: null,
      type: 'expense',
      amount: '',
      description: null,
      date: format(new Date(), 'yyyy-MM-dd'),
    }
  }

  return {
    accountId: transaction.account_id,
    categoryId: transaction.category_id,
    type: transaction.type,
    amount: String(transaction.amount),
    description: transaction.description,
    date: transaction.date,
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Transaction | null
  accounts: AccountOption[]
  categories: CategoryRef[]
}

export function TransactionDialog({ open, onOpenChange, editing, accounts, categories }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const defaultAccountId = accounts[0]?.id ?? ''

  const form = useZodForm<TransactionFormValues, CreateTransactionInput>(createTransactionSchema, {
    defaultValues: toFormValues(editing, defaultAccountId),
  })
  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = form
  const type = watch('type')

  useEffect(() => {
    if (open) reset(toFormValues(editing, defaultAccountId))
  }, [open, editing, defaultAccountId, reset])

  const parents = categories.filter(c => c.type === type && c.parent_id === null)
  const children = categories.filter(c => c.type === type && c.parent_id !== null)
  const orphanChildren = children.filter(c => !parents.some(parent => parent.id === c.parent_id))

  const saveMutation = useMutation({
    mutationFn: async (payload: CreateTransactionInput) => {
      if (editing) {
        await updateTransaction(editing.id, payload)
      } else {
        await createTransaction(payload)
      }
    },
    onSuccess: async () => {
      onOpenChange(false)
      await invalidateTransactionQueries(queryClient)
    },
  })

  const submit = (values: CreateTransactionInput) => {
    if (!user) return
    saveMutation.mutate(values)
  }

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) saveMutation.reset()
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit transaction' : 'New transaction'}</DialogTitle>
          <DialogDescription className="sr-only">
            Record money spent or received, with the account, category, and date.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-5 py-2">
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
            <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                Rp
              </span>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput
                    id="amount"
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
              <Label htmlFor="account" className="text-sm font-medium">Account</Label>
              <Controller
                control={control}
                name="accountId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="account" className="w-full" aria-invalid={Boolean(errors.accountId)}>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {accounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError error={errors.accountId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'none'}
                    onValueChange={value => field.onChange(value === 'none' ? null : value)}
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Uncategorized</SelectItem>
                      {parents.map(parent => (
                        <Fragment key={parent.id}>
                          <SelectItem value={parent.id}>{parent.name}</SelectItem>
                          {children
                            .filter(child => child.parent_id === parent.id)
                            .map(child => (
                              <SelectItem key={child.id} value={child.id} className="pl-12">
                                {child.name}
                              </SelectItem>
                            ))}
                        </Fragment>
                      ))}
                      {orphanChildren.map(child => (
                        <SelectItem key={child.id} value={child.id} className="pl-12">
                          {child.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">Date</Label>
              <Input
                id="date"
                type="date"
                aria-invalid={Boolean(errors.date)}
                {...register('date')}
              />
              <FieldError error={errors.date} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <Input
                    id="description"
                    placeholder="e.g. Lunch with the team"
                    value={field.value ?? ''}
                    onChange={event => field.onChange(event.target.value || null)}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                )}
              />
            </div>
          </div>

          <ErrorNotice error={saveMutation.error} className="text-xs" />

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => close(false)}>Cancel</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? 'Saving...'
                : editing
                  ? 'Save changes'
                  : 'Add transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
