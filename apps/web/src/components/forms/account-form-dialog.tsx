'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { Banknote, CreditCard, Landmark, Wallet } from 'lucide-react'
import { createAccountSchema, type CreateAccountInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useZodForm } from '@/lib/forms'
import type { AccountType } from '@/types/database'
import type { AccountRow as Account } from '@/lib/api/accounts'

export const accountIcons = [
  { value: 'credit-card', label: 'Credit Card', icon: CreditCard },
  { value: 'wallet', label: 'Wallet', icon: Wallet },
  { value: 'landmark', label: 'Bank', icon: Landmark },
  { value: 'banknote', label: 'Cash', icon: Banknote },
]

const accountTypes: Array<{ value: AccountType; label: string }> = [
  { value: 'bank', label: 'Bank' },
  { value: 'e-wallet', label: 'E-Wallet' },
  { value: 'cash', label: 'Cash' },
]

const defaultColors = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#84CC16',
]

interface AccountFormValues {
  name: string
  type: AccountType
  balance: string
  icon: string
  color: string
}

const emptyAccount: AccountFormValues = {
  name: '',
  type: 'bank',
  balance: '0',
  icon: 'landmark',
  color: '#10B981',
}

function toFormValues(account: Account | null): AccountFormValues {
  if (!account) return emptyAccount
  return {
    name: account.name,
    type: account.type,
    balance: String(account.balance),
    icon: account.icon || 'landmark',
    color: account.color || '#10B981',
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: Account | null
  onSubmit: (values: CreateAccountInput) => void
  isPending: boolean
  error: unknown
}

export function AccountFormDialog({ open, onOpenChange, account, onSubmit, isPending, error }: Props) {
  const form = useZodForm<AccountFormValues, CreateAccountInput>(createAccountSchema, {
    defaultValues: toFormValues(account),
  })
  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = form
  const icon = watch('icon')
  const color = watch('color')

  useEffect(() => {
    if (open) reset(toFormValues(account))
  }, [open, account, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{account ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(values => onSubmit(values))} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="account-name" className="text-sm font-medium">Account Name</Label>
            <Input
              id="account-name"
              placeholder="e.g. BCA, GoPay, Cash"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            <FieldError error={errors.name} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account-type" className="text-sm font-medium">Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="account-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {accountTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-balance" className="text-sm font-medium">Balance</Label>
              <Controller
                control={control}
                name="balance"
                render={({ field }) => (
                  <MoneyInput
                    id="account-balance"
                    placeholder="0"
                    value={field.value}
                    onValueChange={value => field.onChange(value || '0')}
                    onBlur={field.onBlur}
                    name={field.name}
                    aria-invalid={Boolean(errors.balance)}
                  />
                )}
              />
              <FieldError error={errors.balance} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Icon</Label>
            <div className="flex gap-2">
              {accountIcons.map(i => {
                const Icon = i.icon
                return (
                  <button
                    key={i.value}
                    type="button"
                    aria-label={i.label}
                    aria-pressed={icon === i.value}
                    onClick={() => setValue('icon', i.value, { shouldValidate: true })}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border transition-all',
                      icon === i.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Color</Label>
            <div className="flex gap-2">
              {defaultColors.map(c => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Use color ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setValue('color', c, { shouldValidate: true })}
                  className={cn(
                    'h-8 w-8 rounded-lg transition-all',
                    color === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <ErrorNotice error={error} className="text-xs" />
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : account ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
