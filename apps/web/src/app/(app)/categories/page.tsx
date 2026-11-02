'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Folder, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import {
  createCategory, deleteCategory, listCategories, updateCategory,
  type CategoryInput, type CategoryRow as Category,
} from '@/lib/api/categories'
import { queryKeys } from '@/lib/query-keys'
import { invalidateCategoryQueries } from '@/lib/query-invalidation'
import { Button } from '@/components/ui/button'
import { ErrorNotice } from '@/components/ui/error-notice'
import { InlineConfirm } from '@/components/ui/inline-confirm'
import { SuccessNotice } from '@/components/ui/success-notice'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoryFormDialog } from '@/components/forms/category-form-dialog'

export default function CategoriesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [addParentId, setAddParentId] = useState('')
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense')
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list,
    queryFn: listCategories,
    enabled: Boolean(user),
  })
  const categories = categoriesQuery.data ?? []
  const loading = categoriesQuery.isPending

  const saveMutation = useMutation({
    mutationFn: async (input: CategoryInput) => {
      if (editingCategory) {
        await updateCategory(editingCategory.id, input)
      } else {
        await createCategory(input)
      }
    },
    onSuccess: async () => {
      const message = editingCategory ? 'Category updated' : 'Category added'
      setDialogOpen(false)
      setNotice(message)
      await invalidateCategoryQueries(queryClient)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      setConfirmingId(null)
      setNotice('Category deleted')
      await invalidateCategoryQueries(queryClient)
    },
  })

  const parents = categories.filter(c => c.parent_id === null)
  const childrenMap = categories.reduce((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = []
      acc[c.parent_id].push(c)
    }
    return acc
  }, {} as Record<string, Category[]>)

  const filteredParents = parents.filter(p => p.type === activeTab)
  const counts = {
    expense: categories.filter(c => c.type === 'expense').length,
    income: categories.filter(c => c.type === 'income').length,
  }

  const toggleExpand = (id: string) => {
    const next = new Set(expandedParents)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedParents(next)
  }

  const openAddDialog = (parentId?: string) => {
    saveMutation.reset()
    deleteMutation.reset()
    setConfirmingId(null)
    setEditingCategory(null)
    setAddParentId(parentId || '')
    setDialogOpen(true)
  }

  const openEditDialog = (cat: Category) => {
    saveMutation.reset()
    deleteMutation.reset()
    setConfirmingId(null)
    setEditingCategory(cat)
    setAddParentId('')
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    deleteMutation.reset()
    deleteMutation.mutate(id)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 h-9 w-56 animate-pulse rounded bg-muted" />
            <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {[1, 2, 3, 4].map(item => (
              <div key={item} className="border-b border-border p-4 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (categoriesQuery.isError && !categoriesQuery.data) {
    return (
      <ErrorNotice
        error={categoriesQuery.error}
        onRetry={() => categoriesQuery.refetch()}
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize income and expenses into clear groups</p>
        </div>
        <Button onClick={() => openAddDialog()} className="h-10 gap-2">
          <Plus className="h-4 w-4" /> Add category
        </Button>
      </div>

      {categoriesQuery.isError && (
        <ErrorNotice
          error={categoriesQuery.error}
          onRetry={() => categoriesQuery.refetch()}
        />
      )}

      {deleteMutation.error && <ErrorNotice error={deleteMutation.error} />}

      <SuccessNotice message={notice} />

      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your categories
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Group transactions with one level of subcategories.
            </p>
          </div>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'expense' | 'income')}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="expense" className="flex-1 gap-1.5 sm:flex-none">
                Expense
                <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
                  {counts.expense}
                </span>
              </TabsTrigger>
              <TabsTrigger value="income" className="flex-1 gap-1.5 sm:flex-none">
                Income
                <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
                  {counts.income}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {filteredParents.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                <Folder className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No {activeTab} categories yet
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Create your first {activeTab} category to start grouping transactions.
              </p>
              <Button onClick={() => openAddDialog()} variant="outline" size="sm" className="mt-4 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add category
              </Button>
            </div>
          ) : (
            <div>
              {filteredParents.map(parent => {
                const children = childrenMap[parent.id] || []
                const isExpanded = expandedParents.has(parent.id)
                const color = parent.color || '#3B82F6'

                return (
                  <div key={parent.id} className="border-b border-border last:border-b-0">
                    <div className="flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-muted/30 sm:gap-3">
                      {children.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(parent.id)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${parent.name}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                        </button>
                      ) : (
                        <span className="h-8 w-8 shrink-0" aria-hidden="true" />
                      )}

                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${color}15`, color }}
                      >
                        <Folder className="h-4 w-4" aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{parent.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {children.length > 0
                            ? `${children.length} ${children.length === 1 ? 'subcategory' : 'subcategories'}`
                            : 'Top-level category'}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          aria-label={`Add subcategory to ${parent.name}`}
                          title="Add subcategory"
                          onClick={() => openAddDialog(parent.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-8 sm:w-8"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Edit ${parent.name}`}
                          title="Edit"
                          onClick={() => openEditDialog(parent)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-8 sm:w-8"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${parent.name}`}
                          title="Delete"
                          onClick={() => {
                            deleteMutation.reset()
                            setConfirmingId(parent.id)
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:h-8 sm:w-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {confirmingId === parent.id && (
                      <div className="px-3 pb-3 sm:pl-14">
                        <InlineConfirm
                          title={`Delete “${parent.name}”?`}
                          description={
                            children.length > 0
                              ? `Its ${children.length === 1 ? 'subcategory' : 'subcategories'} will move to the top level, and related transactions will become uncategorized.`
                              : 'Related transactions will keep their history but become uncategorized.'
                          }
                          onCancel={() => setConfirmingId(null)}
                          onConfirm={() => handleDelete(parent.id)}
                          isPending={deleteMutation.isPending && deleteMutation.variables === parent.id}
                        />
                      </div>
                    )}

                    {isExpanded && children.length > 0 && (
                      <div className="ml-9 border-l border-border sm:ml-12">
                        {children.map(child => {
                          const childColor = child.color || color
                          return (
                            <div key={child.id}>
                              <div className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/30">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: childColor }}
                                  aria-hidden="true"
                                />
                                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                  {child.name}
                                </span>
                                <div className="flex shrink-0 items-center gap-0.5">
                                  <button
                                    type="button"
                                    aria-label={`Edit ${child.name}`}
                                    title="Edit"
                                    onClick={() => openEditDialog(child)}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-8 sm:w-8"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Delete ${child.name}`}
                                    title="Delete"
                                    onClick={() => {
                                      deleteMutation.reset()
                                      setConfirmingId(child.id)
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:h-8 sm:w-8"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              {confirmingId === child.id && (
                                <InlineConfirm
                                  title={`Delete “${child.name}”?`}
                                  description="Related transactions will keep their history but become uncategorized."
                                  className="mx-3 mb-3"
                                  onCancel={() => setConfirmingId(null)}
                                  onConfirm={() => handleDelete(child.id)}
                                  isPending={deleteMutation.isPending && deleteMutation.variables === child.id}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open)
          if (!open) saveMutation.reset()
        }}
        category={editingCategory}
        type={activeTab}
        parentId={addParentId || undefined}
        parents={parents}
        onSubmit={values => saveMutation.mutate(values)}
        isPending={saveMutation.isPending}
        error={saveMutation.error}
      />
    </div>
  )
}
