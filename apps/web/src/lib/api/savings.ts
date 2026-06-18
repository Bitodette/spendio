import { apiFetch } from '@/lib/api/client'
import { fromMoney } from '@/lib/api/money'
import type { CreateSavingsGoalInput, UpdateSavingsGoalInput } from '@spendio/shared'

export interface SavingsGoalRow {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  icon: string | null
  color: string | null
  created_at: string
  updated_at: string
}

export type SavingsGoalInput = CreateSavingsGoalInput

interface SavingsGoalDto {
  id: string
  userId: string
  name: string
  targetAmount: string
  currentAmount: string
  deadline: string | null
  icon: string | null
  color: string | null
  createdAt: string
  updatedAt: string
}

function toSavingsGoalRow(dto: SavingsGoalDto): SavingsGoalRow {
  return {
    id: dto.id,
    user_id: dto.userId,
    name: dto.name,
    target_amount: fromMoney(dto.targetAmount),
    current_amount: fromMoney(dto.currentAmount),
    deadline: dto.deadline,
    icon: dto.icon,
    color: dto.color,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  }
}

export async function listSavingsGoals(): Promise<SavingsGoalRow[]> {
  const rows = await apiFetch<SavingsGoalDto[]>('/api/v1/savings-goals')
  return rows.map(toSavingsGoalRow)
}

export async function createSavingsGoal(input: SavingsGoalInput): Promise<void> {
  await apiFetch('/api/v1/savings-goals', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateSavingsGoal(id: string, input: UpdateSavingsGoalInput): Promise<void> {
  await apiFetch(`/api/v1/savings-goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await apiFetch(`/api/v1/savings-goals/${id}`, { method: 'DELETE' })
}

/** Adds to a goal with `current_amount + $n` in SQL, so concurrent adds are safe. */
export async function addToSavingsGoal(goal: SavingsGoalRow, amount: string): Promise<void> {
  await apiFetch(`/api/v1/savings-goals/${goal.id}/contribute`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  })
}
