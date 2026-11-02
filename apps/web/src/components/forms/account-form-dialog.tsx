'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { Banknote, CreditCard, Landmark, Wallet } from 'lucide-react'
import { createAccountSchema, type CreateAccountInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MoneyInput } from '@/components/ui/money-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatCurrency } from '@/lib/utils'
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
  { value: 'e-wallet', label: 'E-wallet' },
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
  const name = watch('name')
  const type = watch('type')
  const balance = watch('balance')
  const icon = watch('icon')
  const color = watch('color')
  const previewBalance = Number(balance || 0)
  const PreviewIcon = accountIcons.find(item => item.value === icon)?.icon || Landmark
  const previewType = accountTypes.find(item => item.value === type)?.label || 'Bank'

  useEffect(() => {
    if (open) reset(toFormValues(account))
  }, [open, account, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="text-lg font-semibold">
            {account ? 'Edit account' : 'Add account'}
          </DialogTitle>
          <DialogDescription>
            {account
              ? 'Update how this account appears and what it is worth.'
              : 'Set how this account appears and what it is worth right now.'}
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
              <PreviewIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {name.trim() || 'Account name'}
              </p>
              <p className="text-xs text-muted-foreground">{previewType}</p>
            </div>
            <p className={cn(
              'shrink-0 font-heading text-sm font-bold tabular-nums sm:text-base',
              previewBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground',
            )}>
              {formatCurrency(previewBalance)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-name" className="text-sm font-medium">Account name</Label>
            <Input
              id="account-name"
              className="h-9"
              placeholder="e.g. BCA, GoPay, Cash"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            <FieldError error={errors.name} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-type" className="text-sm font-medium">Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="account-type" className="h-9 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      {accountTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-balance" className="text-sm font-medium">Balance</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  Rp
                </span>
                <Controller
                  control={control}
                  name="balance"
                  render={({ field }) => (
                    <MoneyInput
                      id="account-balance"
                      className="h-9 pl-9 tabular-nums"
                      placeholder="0"
                      value={field.value}
                      onValueChange={value => field.onChange(value || '0')}
                      onBlur={field.onBlur}
                      name={field.name}
                      aria-invalid={Boolean(errors.balance)}
                    />
                  )}
                />
              </div>
              <FieldError error={errors.balance} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
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
                        'flex h-11 w-11 items-center justify-center rounded-lg border transition-all sm:h-9 sm:w-9',
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
              <div className="flex flex-wrap gap-2">
                {defaultColors.map(c => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Use color ${c}`}
                    aria-pressed={color === c}
                    onClick={() => setValue('color', c, { shouldValidate: true })}
                    className={cn(
                      'h-9 w-9 rounded-lg transition-all sm:h-9 sm:w-9',
                      color === c ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background' : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <ErrorNotice error={error} className="text-xs" />

          <DialogFooter className="-mx-5 -mb-5 mt-1 flex-row justify-end gap-2 rounded-b-2xl border-t bg-muted/30 px-5 py-4 sm:-mx-6 sm:px-6">
            <Button type="button" variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-9" disabled={isPending}>
              {isPending ? 'Saving...' : account ? 'Save changes' : 'Add account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
