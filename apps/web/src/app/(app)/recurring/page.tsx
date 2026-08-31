'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import {
  createRecurring, deleteRecurring, listRecurring, postDueRecurring,
  setRecurringActive, updateRecurring, type RecurringInput, type RecurringRow,
} from '@/lib/api/recurring'
import { listAccountOptions, type AccountOptionRow } from '@/lib/api/accounts'
import { listCategories, type CategoryRow } from '@/lib/api/categories'
import { format } from 'date-fns'
import { Repeat, Plus, Pencil, Trash2, Pause, Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { queryKeys } from '@/lib/query-keys'
import { invalidateRecurringQueries } from '@/lib/query-invalidation'
import { ErrorNotice } from '@/components/ui/error-notice'
import { RecurringFormDialog } from '@/components/forms/recurring-form-dialog'
import { cn, formatCurrency } from '@/lib/utils'

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly',
}

export default function RecurringPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringRow | null>(null)
  const generatedRef = useRef(false)

  const itemsQuery = useQuery({
    queryKey: queryKeys.recurring.list,
    queryFn: listRecurring,
    enabled: Boolean(user),
  })
  const accountsQuery = useQuery({
    queryKey: queryKeys.accounts.options,
    queryFn: listAccountOptions,
    enabled: Boolean(user),
  })
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list,
    queryFn: listCategories,
    enabled: Boolean(user),
  })
  const items = itemsQuery.data ?? []
  const accounts: AccountOptionRow[] = accountsQuery.data ?? []
  const categories: CategoryRow[] = categoriesQuery.data ?? []
  const optionsUnavailable =
    (accountsQuery.isError && !accountsQuery.data) ||
    (categoriesQuery.isError && !categoriesQuery.data)
  const loading = itemsQuery.isPending || accountsQuery.isPending || categoriesQuery.isPending

  const saveMutation = useMutation({
    mutationFn: async (input: RecurringInput) => {
      if (editing) {
        await updateRecurring(editing.id, input)
      } else {
        await createRecurring(input)
      }
    },
    onSuccess: async () => {
      setDialogOpen(false)
      await invalidateRecurringQueries(queryClient)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => invalidateRecurringQueries(queryClient),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setRecurringActive(id, isActive),
    onSuccess: () => invalidateRecurringQueries(queryClient),
  })

  const generateMutation = useMutation({
    mutationFn: async (due: RecurringRow[]) => {
      await postDueRecurring(due)
    },
    onSettled: () => invalidateRecurringQueries(queryClient),
  })
  const generateDue = generateMutation.mutate

  useEffect(() => {
    const allItems = itemsQuery.data
    if (!allItems || generatedRef.current) return
    generatedRef.current = true

    const today = format(new Date(), 'yyyy-MM-dd')
    const due = allItems.filter(i => i.is_active && i.next_date <= today)
    if (due.length) generateDue(due)
  }, [itemsQuery.data, generateDue])

  function openCreate() {
    saveMutation.reset()
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(item: RecurringRow) {
    saveMutation.reset()
    setEditing(item)
    setDialogOpen(true)
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this recurring transaction?')) return
    deleteMutation.reset()
    deleteMutation.mutate(id)
  }

  function toggleActive(item: RecurringRow) {
    toggleMutation.reset()
    toggleMutation.mutate({ id: item.id, isActive: !item.is_active })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (itemsQuery.isError && !itemsQuery.data) {
    return (
      <ErrorNotice
        error={itemsQuery.error}
        onRetry={() => itemsQuery.refetch()}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-semibold tracking-tight">Recurring Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.filter(i => i.is_active).length} active of {items.length} total
            {generateMutation.isPending && <span className="ml-2 text-primary">Generating...</span>}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" disabled={optionsUnavailable}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {(itemsQuery.isError || accountsQuery.isError || categoriesQuery.isError) && (
        <ErrorNotice
          error={itemsQuery.error ?? accountsQuery.error ?? categoriesQuery.error}
          onRetry={() => {
            void itemsQuery.refetch()
            void accountsQuery.refetch()
            void categoriesQuery.refetch()
          }}
          className="mb-4"
        />
      )}

      {(deleteMutation.error || toggleMutation.error || generateMutation.error) && (
        <ErrorNotice
          error={deleteMutation.error ?? toggleMutation.error ?? generateMutation.error}
          className="mb-4"
        />
      )}

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Repeat className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No recurring transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const acc = accounts.find(a => a.id === item.account_id)
            const cat = categories.find(c => c.id === item.category_id)
            return (
              <Card key={item.id} className={cn(!item.is_active && 'opacity-50')}>
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <div className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                    item.type === 'expense' ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'
                  )}>
                    <Repeat className={cn('h-4 w-4',
                      item.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {item.description || (cat?.name || 'No category')}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {FREQUENCY_LABELS[item.frequency]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {acc?.name} · Next: {item.next_date}
                    </p>
                  </div>
                  <span className={cn('text-sm font-semibold tabular-nums',
                    item.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                  )}>
                    {item.type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(item)}>
                      {item.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <RecurringFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) saveMutation.reset()
        }}
        item={editing}
        accounts={accounts}
        categories={categories}
        onSubmit={values => saveMutation.mutate(values)}
        isPending={saveMutation.isPending}
        error={saveMutation.error}
      />
    </div>
  )
}
