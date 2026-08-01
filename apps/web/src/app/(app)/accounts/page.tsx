'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import {
  createAccount, deleteAccount, listAccounts, reorderAccounts, updateAccount,
  type AccountInput, type AccountRow as Account,
} from '@/lib/api/accounts'
import { queryKeys } from '@/lib/query-keys'
import { invalidateAccountQueries } from '@/lib/query-invalidation'
import { ErrorNotice } from '@/components/ui/error-notice'
import {
  Plus, Edit, Trash2, Landmark, Wallet, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccountFormDialog, accountIcons } from '@/components/forms/account-form-dialog'
import { cn, formatCurrency } from '@/lib/utils'

export default function AccountsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts.list,
    queryFn: listAccounts,
    enabled: Boolean(user),
  })
  const accounts = accountsQuery.data ?? []
  const loading = accountsQuery.isPending

  const saveMutation = useMutation({
    mutationFn: async (input: AccountInput) => {
      if (editingAccount) {
        await updateAccount(editingAccount.id, input)
      } else {
        await createAccount(input)
      }
    },
    onSuccess: async () => {
      setDialogOpen(false)
      await invalidateAccountQueries(queryClient)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => invalidateAccountQueries(queryClient),
  })

  const reorderMutation = useMutation({
    mutationFn: ({ ids }: { ids: string[]; ordered: Account[] }) => reorderAccounts(ids),
    onMutate: async ({ ordered }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.accounts.list })
      const previous = queryClient.getQueryData<Account[]>(queryKeys.accounts.list)
      queryClient.setQueryData(queryKeys.accounts.list, ordered)
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.accounts.list, context.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  })

  const openAddDialog = () => {
    saveMutation.reset()
    setEditingAccount(null)
    setDialogOpen(true)
  }

  const openEditDialog = (account: Account) => {
    saveMutation.reset()
    setEditingAccount(account)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this account? Related transactions will also be deleted.')) return
    deleteMutation.reset()
    deleteMutation.mutate(id)
  }

  const getIconComponent = (iconName: string) => {
    return accountIcons.find(i => i.value === iconName)?.icon || Landmark
  }

  const moveAccount = (index: number, direction: -1 | 1) => {
    if (reorderMutation.isPending) return

    const target = index + direction
    if (target < 0 || target >= accounts.length) return

    const ordered = [...accounts]
    const [moved] = ordered.splice(index, 1)
    ordered.splice(target, 0, moved)
    reorderMutation.mutate({ ids: ordered.map(acc => acc.id), ordered })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-9 w-36 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-xl" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </div>
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (accountsQuery.isError && !accountsQuery.data) {
    return (
      <ErrorNotice
        error={accountsQuery.error}
        onRetry={() => accountsQuery.refetch()}
      />
    )
  }

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage bank accounts, e-wallets, and cash</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="h-4 w-4" /> Add Account
        </Button>
      </div>

      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) saveMutation.reset()
        }}
        account={editingAccount}
        onSubmit={values => saveMutation.mutate(values)}
        isPending={saveMutation.isPending}
        error={saveMutation.error}
      />

      {accountsQuery.isError && (
        <ErrorNotice
          error={accountsQuery.error}
          onRetry={() => accountsQuery.refetch()}
        />
      )}

      {(deleteMutation.error || reorderMutation.error) && (
        <ErrorNotice error={deleteMutation.error ?? reorderMutation.error} />
      )}

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Balance</p>
        <p className="font-heading text-3xl font-bold text-foreground tracking-tight">{formatCurrency(totalBalance)}</p>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No accounts yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first account to start tracking finances</p>
          <Button onClick={openAddDialog} variant="outline" size="sm" className="mt-4 gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Account
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account, index) => (
            <AccountCard
              key={account.id}
              account={account}
              getIconComponent={getIconComponent}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onMoveUp={() => moveAccount(index, -1)}
              onMoveDown={() => moveAccount(index, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < accounts.length - 1}
              isReordering={reorderMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AccountCard({
  account, getIconComponent, onEdit, onDelete, onMoveUp, onMoveDown,
  canMoveUp, canMoveDown, isReordering,
}: {
  account: Account
  getIconComponent: (icon: string) => React.ComponentType<{ className?: string }>
  onEdit: (account: Account) => void
  onDelete: (id: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  isReordering: boolean
}) {
  const Icon = getIconComponent(account.icon || 'landmark')
  const color = account.color || '#10B981'
  const moveDisabled = isReordering

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {/* eslint-disable-next-line react-hooks/static-components -- Icon is a reference from a static map, not a new component */}
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">{account.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label={`Move ${account.name} up`}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
            disabled={!canMoveUp || moveDisabled}
            onClick={onMoveUp}
          >
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            aria-label={`Move ${account.name} down`}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
            disabled={!canMoveDown || moveDisabled}
            onClick={onMoveDown}
          >
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            aria-label={`Edit ${account.name}`}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            onClick={() => onEdit(account)}
          >
            <Edit className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${account.name}`}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            onClick={() => onDelete(account.id)}
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>
      </div>
      <p className={cn(
        'font-heading text-xl font-bold tabular-nums',
        account.balance >= 0 ? 'text-foreground' : 'text-red-600 dark:text-red-400'
      )}>
        {formatCurrency(account.balance)}
      </p>
    </div>
  )
}
