'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { Folder } from 'lucide-react'
import { createCategorySchema, type CreateCategoryInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ErrorNotice } from '@/components/ui/error-notice'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useZodForm } from '@/lib/forms'
import type { CategoryRow as Category } from '@/lib/api/categories'
import type { TxType } from '@/types/database'

const colors = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
]

const categoryFormSchema = createCategorySchema.pick({ name: true, parentId: true, color: true })

interface CategoryFormValues {
  name: string
  parentId: string | null
  color: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  type: TxType
  parentId?: string
  parents: Category[]
  onSubmit: (values: CreateCategoryInput) => void
  isPending: boolean
  error: unknown
}

function toFormValues(category: Category | null, parentId?: string): CategoryFormValues {
  return {
    name: category?.name ?? '',
    parentId: category?.parent_id ?? parentId ?? null,
    color: category?.color || '#3B82F6',
  }
}

export function CategoryFormDialog({
  open, onOpenChange, category, type, parentId, parents, onSubmit, isPending, error,
}: Props) {
  const form = useZodForm<CategoryFormValues, { name: string; parentId?: string | null; color?: string | null }>(
    categoryFormSchema,
    { defaultValues: toFormValues(category, parentId) },
  )
  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = form
  const name = watch('name')
  const selectedParentId = watch('parentId')
  const color = watch('color')
  const parentName = parents.find(p => p.id === selectedParentId)?.name

  useEffect(() => {
    if (open) reset(toFormValues(category, parentId))
  }, [open, category, parentId, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left sm:px-6">
          <DialogTitle className="text-lg font-semibold">
            {category ? 'Edit category' : 'Add category'}
          </DialogTitle>
          <DialogDescription>
            {category
              ? 'Update how this category appears and where it sits in the list.'
              : parentName
                ? `Add a subcategory under ${parentName}.`
                : 'Create a group to keep similar transactions together.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(values => onSubmit({ ...values, type }))} className="space-y-5 px-5 py-5 sm:px-6">
          <div
            aria-hidden="true"
            className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}15`, color }}
            >
              <Folder className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {name.trim() || 'Category name'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {parentName
                  ? `Subcategory of ${parentName}`
                  : `${type === 'expense' ? 'Expense' : 'Income'} · Top-level category`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-name" className="text-sm font-medium">Category name</Label>
            <Input
              id="category-name"
              className="h-9"
              placeholder="e.g. Food, Transport, Salary"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            <FieldError error={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-parent" className="text-sm font-medium">
              Parent category <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? 'none'}
                  onValueChange={value => field.onChange(value === 'none' ? null : value)}
                >
                  <SelectTrigger id="category-parent" className="h-9 w-full">
                    <SelectValue placeholder="No parent" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={4}>
                    <SelectItem value="none">No parent</SelectItem>
                    {parents
                      .filter(p => p.type === type && p.id !== category?.id)
                      .map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Color</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Use color ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setValue('color', c, { shouldValidate: true })}
                  className={cn(
                    'h-8 w-8 rounded-lg transition-all',
                    color === c
                      ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background'
                      : 'hover:scale-105',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <ErrorNotice error={error} className="text-xs" />

          <DialogFooter className="-mx-5 -mb-5 mt-1 flex-row justify-end gap-2 rounded-b-2xl border-t bg-muted/30 px-5 py-4 sm:-mx-6 sm:px-6">
            <Button type="button" variant="outline" className="h-9" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="h-9" disabled={isPending}>
              {isPending ? 'Saving...' : category ? 'Save changes' : 'Add category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
