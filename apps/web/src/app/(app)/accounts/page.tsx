'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical, Landmark, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import {
  createAccount, deleteAccount, listAccounts, reorderAccounts, updateAccount,
  type AccountInput, type AccountRow as Account,
} from '@/lib/api/accounts'
import { queryKeys } from '@/lib/query-keys'
import { invalidateAccountQueries } from '@/lib/query-invalidation'
import { ErrorNotice } from '@/components/ui/error-notice'
import { Button } from '@/components/ui/button'
import { AccountFormDialog, accountIcons } from '@/components/forms/account-form-dialog'
import { cn, formatCurrency } from '@/lib/utils'

const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
  bank: 'Bank',
  'e-wallet': 'E-wallet',
  cash: 'Cash',
}

export default function AccountsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts.list,
    queryFn: listAccounts,
    enabled: Boolean(user),
  })
  const accounts = accountsQuery.data ?? []
  const loading = accountsQuery.isPending

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  const saveMutation = useMutation({
    mutationFn: async (input: AccountInput) => {
      if (editingAccount) {
        await updateAccount(editingAccount.id, input)
      } else {
        await createAccount(input)
      }
    },
    onSuccess: async () => {
      const message = editingAccount ? 'Account updated' : 'Account added'
      setDialogOpen(false)
      setNotice(message)
      await invalidateAccountQueries(queryClient)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      setNotice('Account deleted')
      await invalidateAccountQueries(queryClient)
    },
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const announcements: Announcements = {
    onDragStart({ active }) {
      const account = accounts.find(item => item.id === active.id)
      return account ? `Picked up ${account.name}.` : 'Picked up account.'
    },
    onDragOver({ active, over }) {
      if (!over) return 'Moved outside the account list.'
      const account = accounts.find(item => item.id === active.id)
      const target = accounts.find(item => item.id === over.id)
      return account && target ? `${account.name} is over ${target.name}.` : 'Account moved.'
    },
    onDragEnd({ active, over }) {
      if (!over) return 'Account dropped.'
      const account = accounts.find(item => item.id === active.id)
      const target = accounts.find(item => item.id === over.id)
      return account && target ? `${account.name} dropped on ${target.name}.` : 'Account dropped.'
    },
    onDragCancel() {
      return 'Reorder cancelled.'
    },
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || reorderMutation.isPending) return

    const oldIndex = accounts.findIndex(account => account.id === active.id)
    const newIndex = accounts.findIndex(account => account.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const ordered = arrayMove(accounts, oldIndex, newIndex)
    reorderMutation.mutate({ ids: ordered.map(account => account.id), ordered })
  }

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
    deleteMutation.reset()
    deleteMutation.mutate(id)
  }

  const getIconComponent = (iconName: string | null) => {
    return accountIcons.find(icon => icon.value === iconName)?.icon || Landmark
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 h-9 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
        </div>
        <div>
          <div className="mb-2 h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-56 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(item => (
            <div key={item} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="space-y-1.5">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-12 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-7 w-32 animate-pulse rounded bg-muted" />
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

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage bank accounts, e-wallets, and cash</p>
        </div>
        <Button onClick={openAddDialog} className="h-10 gap-2">
          <Plus className="h-4 w-4" /> Add account
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

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
        >
          <Check className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Total balance</p>
        <p className={cn(
          'font-heading text-4xl font-bold tracking-tight',
          totalBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground',
        )}>
          {formatCurrency(totalBalance)}
        </p>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No accounts yet</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Add your first account to start tracking where your money lives.
          </p>
          <Button onClick={openAddDialog} variant="outline" size="sm" className="mt-4 gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add account
          </Button>
        </div>
      ) : (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your accounts</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {accounts.length > 1
                  ? 'Drag the handle to change the order.'
                  : 'Add another account to reorder.'}
              </p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            accessibility={{ announcements }}
          >
            <SortableContext
              items={accounts.map(account => account.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {accounts.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    getIconComponent={getIconComponent}
                    onEdit={openEditDialog}
                    onDelete={handleDelete}
                    isDeleting={deleteMutation.isPending && deleteMutation.variables === account.id}
                    isReordering={reorderMutation.isPending}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}
    </div>
  )
}

function AccountCard({
  account, getIconComponent, onEdit, onDelete, isDeleting, isReordering,
}: {
  account: Account
  getIconComponent: (icon: string | null) => React.ComponentType<{ className?: string }>
  onEdit: (account: Account) => void
  onDelete: (id: string) => void
  isDeleting: boolean
  isReordering: boolean
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging,
  } = useSortable({ id: account.id, disabled: isReordering })

  const Icon = getIconComponent(account.icon)
  const color = account.color || '#10B981'

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative rounded-xl border border-border bg-card p-4 transition-shadow',
        isDragging && 'z-10 border-primary/30 opacity-80 shadow-lg',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {/* eslint-disable-next-line react-hooks/static-components -- Icon is a reference from a static map, not a new component */}
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-heading text-sm font-semibold text-foreground">{account.name}</h3>
            <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[account.type]}</p>
          </div>
        </div>

        <div className="-mr-1 -mt-1 flex shrink-0 items-center">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${account.name}`}
            aria-roledescription="sortable account"
            className="flex h-11 w-11 touch-none cursor-grab items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 lg:h-8 lg:w-8"
            disabled={isReordering}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={`Edit ${account.name}`}
            onClick={() => onEdit(account)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:h-8 lg:w-8"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${account.name}`}
            onClick={() => setConfirmingDelete(true)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 lg:h-8 lg:w-8"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p className={cn(
        'mt-5 font-heading text-2xl font-bold tabular-nums',
        account.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground',
      )}>
        {formatCurrency(account.balance)}
      </p>

      {confirmingDelete && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
          <p className="text-xs font-medium text-foreground">Delete this account?</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Related transactions will also be deleted.</p>
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmingDelete(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(account.id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
