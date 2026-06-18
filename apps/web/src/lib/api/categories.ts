import { apiFetch } from '@/lib/api/client'
import type { TxType } from '@/types/database'
import type { CreateCategoryInput, UpdateCategoryInput } from '@spendio/shared'

export interface CategoryRow {
  id: string
  user_id: string
  parent_id: string | null
  name: string
  icon: string | null
  color: string | null
  type: TxType
  created_at: string
}

export type CategoryInput = CreateCategoryInput

interface CategoryDto {
  id: string
  userId: string
  parentId: string | null
  name: string
  icon: string | null
  color: string | null
  type: TxType
  createdAt: string
}

function toCategoryRow(dto: CategoryDto): CategoryRow {
  return {
    id: dto.id,
    user_id: dto.userId,
    parent_id: dto.parentId,
    name: dto.name,
    icon: dto.icon,
    color: dto.color,
    type: dto.type,
    created_at: dto.createdAt,
  }
}

export async function listCategories(): Promise<CategoryRow[]> {
  const rows = await apiFetch<CategoryDto[]>('/api/v1/categories')
  return rows.map(toCategoryRow)
}

export async function listExpenseCategories(): Promise<CategoryRow[]> {
  const rows = await apiFetch<CategoryDto[]>('/api/v1/categories?type=expense')
  return rows.map(toCategoryRow)
}

export async function createCategory(input: CategoryInput): Promise<void> {
  await apiFetch('/api/v1/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<void> {
  await apiFetch(`/api/v1/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/api/v1/categories/${id}`, { method: 'DELETE' })
}
