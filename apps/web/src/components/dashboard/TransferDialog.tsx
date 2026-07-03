'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTransferSchema, type CreateTransferInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useZodForm } from '@/lib/forms'
import { formatCurrency } from '@/lib/utils'
import { transferBetweenAccounts } from '@/lib/api/transfer'
import { invalidateTransactionQueries } from '@/lib/query-invalidation'
import type { Account } from '@/types/database'

const EMPTY_FORM = {
  fromId: '',
  toId: '',
  amount: '',
  fee: '0',
  description: '',
}

interface Props {
  accounts: Account[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransferDialog({ accounts, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const form = useZodForm<typeof EMPTY_FORM, CreateTransferInput>(createTransferSchema, {
    defaultValues: EMPTY_FORM,
  })
  const { control, handleSubmit, reset, setValue, getValues, register, formState: { errors } } = form

  useEffect(() => {
    if (open) reset(EMPTY_FORM)
  }, [open, reset])

  const transferMutation = useMutation({
    mutationFn: (input: CreateTransferInput) => transferBetweenAccounts(input),
    onSuccess: async () => {
      onOpenChange(false)
      await invalidateTransactionQueries(queryClient)
    },
  })

  const close = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      reset(EMPTY_FORM)
      transferMutation.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Transfer Between Accounts</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(values => transferMutation.mutate(values))} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>From</Label>
            <Controller
              control={control}
              name="fromId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={value => {
                    field.onChange(value)
                    if (getValues('toId') === value) setValue('toId', '')
                  }}
                >
                  <SelectTrigger aria-invalid={Boolean(errors.fromId)}>
                    <SelectValue placeholder="Source account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError error={errors.fromId} />
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <Controller
              control={control}
              name="toId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={Boolean(errors.toId)}>
                    <SelectValue placeholder="Destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => a.id !== getValues('fromId')).map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError error={errors.toId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Amount (Rp)</Label>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <MoneyInput
                  id="transfer-amount"
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

          <div className="space-y-2">
            <Label htmlFor="transfer-fee">Admin Fee (Rp)</Label>
            <Controller
              control={control}
              name="fee"
              render={({ field }) => (
                <MoneyInput
                  id="transfer-fee"
                  placeholder="0"
                  value={field.value}
                  onValueChange={value => field.onChange(value || '0')}
                  onBlur={field.onBlur}
                  name={field.name}
                  aria-invalid={Boolean(errors.fee)}
                />
              )}
            />
            <FieldError error={errors.fee} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-description">
              Note <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="transfer-description"
              placeholder="e.g. Transfer to savings"
              aria-invalid={Boolean(errors.description)}
              {...register('description')}
            />
          </div>

          <ErrorNotice error={transferMutation.error} className="text-xs" />
          <FieldError error={errors.root} />
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => close(false)}>Cancel</Button>
            <Button type="submit" disabled={transferMutation.isPending}>
              {transferMutation.isPending ? 'Transferring...' : 'Transfer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
