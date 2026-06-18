import { apiFetch } from '@/lib/api/client'
import { fromMoney } from '@/lib/api/money'
import type { CreateBudgetInput, UpdateBudgetInput } from '@spendio/shared'

export interface BudgetRow {
  id: string
  user_id: string
  category_id: string
  amount: number
  period: 'monthly' | 'yearly'
  start_date: string
  created_at: string
  category: BudgetCategory | null
}

export interface BudgetCategory {
  id: string
  name: string
  color: string | null
  type: string
}

export interface BudgetWithSpent extends BudgetRow {
  spent: number
  remaining: number
  percentage: number
}

export type BudgetInput = CreateBudgetInput

interface BudgetDto {
  id: string
  userId: string
  categoryId: string
  amount: string
  period: 'monthly' | 'yearly'
  startDate: string
  createdAt: string
  category: BudgetCategory | null
  spent: string
  remaining: string
  percentage: number
}

function toBudgetWithSpent(dto: BudgetDto): BudgetWithSpent {
  return {
    id: dto.id,
    user_id: dto.userId,
    category_id: dto.categoryId,
    amount: fromMoney(dto.amount),
    period: dto.period,
    start_date: dto.startDate,
    created_at: dto.createdAt,
    category: dto.category,
    spent: fromMoney(dto.spent),
    remaining: fromMoney(dto.remaining),
    percentage: dto.percentage,
  }
}

/**
 * Budgets for one period, enriched with the spending in that period.
 *
 * `monthOffset` follows the page's control: 0 is the current month, 1 is the
 * month before it.
 */
export async function listBudgetsWithSpending(
  period: 'monthly' | 'yearly',
  monthOffset: number,
): Promise<BudgetWithSpent[]> {
  const query = new URLSearchParams({
    period,
    monthOffset: String(monthOffset),
  })
  const rows = await apiFetch<BudgetDto[]>(`/api/v1/budgets?${query}`)
  return rows.map(toBudgetWithSpent)
}

export async function createBudget(input: BudgetInput): Promise<void> {
  await apiFetch('/api/v1/budgets', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateBudget(id: string, input: UpdateBudgetInput): Promise<void> {
  await apiFetch(`/api/v1/budgets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteBudget(id: string): Promise<void> {
  await apiFetch(`/api/v1/budgets/${id}`, { method: 'DELETE' })
}
