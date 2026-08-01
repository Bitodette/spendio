'use client'

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { createCategorySchema, type CreateCategoryInput } from '@spendio/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  const color = watch('color')

  useEffect(() => {
    if (open) reset(toFormValues(category, parentId))
  }, [open, category, parentId, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{category ? 'Edit Category' : 'Add Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(values => onSubmit({ ...values, type }))} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="category-name" className="text-sm font-medium">Category Name</Label>
            <Input
              id="category-name"
              placeholder="e.g. Food, Transport, Salary"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
            />
            <FieldError error={errors.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-parent" className="text-sm font-medium">
              Parent Category <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? 'none'}
                  onValueChange={value => field.onChange(value === 'none' ? null : value)}
                >
                  <SelectTrigger id="category-parent"><SelectValue placeholder="No parent" /></SelectTrigger>
                  <SelectContent>
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
              {isPending ? 'Saving...' : category ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
