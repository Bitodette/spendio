'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import {
  createCategory, deleteCategory, listCategories, updateCategory,
  type CategoryInput, type CategoryRow as Category,
} from '@/lib/api/categories'
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Folder } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { queryKeys } from '@/lib/query-keys'
import { invalidateCategoryQueries } from '@/lib/query-invalidation'
import { ErrorNotice } from '@/components/ui/error-notice'
import { CategoryFormDialog } from '@/components/forms/category-form-dialog'

export default function CategoriesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [addParentId, setAddParentId] = useState('')
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('expense')
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())

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
      setDialogOpen(false)
      await invalidateCategoryQueries(queryClient)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => invalidateCategoryQueries(queryClient),
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

  const toggleExpand = (id: string) => {
    const next = new Set(expandedParents)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedParents(next)
  }

  const openAddDialog = (parentId?: string) => {
    saveMutation.reset()
    setEditingCategory(null)
    setAddParentId(parentId || '')
    setDialogOpen(true)
  }

  const openEditDialog = (cat: Category) => {
    saveMutation.reset()
    setEditingCategory(cat)
    setAddParentId('')
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this category?')) return
    deleteMutation.reset()
    deleteMutation.mutate(id)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-40 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-9 w-36 bg-muted animate-pulse rounded-lg" />
        </div>
        <Card><CardContent className="pt-6"><div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div></CardContent></Card>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage income and expense categories</p>
        </div>
        <Button onClick={() => openAddDialog()} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {categoriesQuery.isError && (
        <ErrorNotice
          error={categoriesQuery.error}
          onRetry={() => categoriesQuery.refetch()}
        />
      )}

      {deleteMutation.error && <ErrorNotice error={deleteMutation.error} />}

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'expense' | 'income')}>
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">Expense</TabsTrigger>
              <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-4">
          {filteredParents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Folder className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No categories yet {activeTab === 'expense' ? 'expense' : 'income'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Create categories to group your transactions</p>
              <Button onClick={() => openAddDialog()} variant="outline" size="sm" className="mt-4 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Category
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredParents.map(parent => {
                const children = childrenMap[parent.id] || []
                const isExpanded = expandedParents.has(parent.id)
                return (
                  <div key={parent.id}>
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors">
                      <button
                        onClick={() => toggleExpand(parent.id)}
                        className="shrink-0 p-0.5 rounded hover:bg-muted"
                      >
                        {children.length > 0 ? (
                          isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <div className="w-4" />
                        )}
                      </button>
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${parent.color || '#3B82F6'}15`, color: parent.color || '#3B82F6' }}
                      >
                        <Folder className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-foreground">{parent.name}</span>
                      {children.length > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                          {children.length}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5">
                        <button
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          onClick={() => openAddDialog(parent.id)}
                        >
                          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          onClick={() => openEditDialog(parent)}
                        >
                          <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          onClick={() => handleDelete(parent.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                    {isExpanded && children.length > 0 && (
                      <div className="ml-12 space-y-0.5">
                        {children.map(child => (
                          <div key={child.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: child.color || parent.color || '#3B82F6' }}
                            />
                            <span className="flex-1 text-sm text-foreground">{child.name}</span>
                            <div className="flex items-center gap-0.5">
                              <button
                                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                onClick={() => openEditDialog(child)}
                              >
                                <Edit className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                onClick={() => handleDelete(child.id)}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

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
