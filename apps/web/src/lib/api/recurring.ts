import { apiFetch } from '@/lib/api/client'
import { fromMoney } from '@/lib/api/money'
import type { TxType } from '@/types/database'
import type { CreateRecurringInput, UpdateRecurringInput } from '@spendio/shared'

export type Frequency = 'weekly' | 'monthly' | 'yearly'

export interface RecurringRow {
  id: string
  account_id: string
  category_id: string | null
  type: TxType
  amount: number
  description: string | null
  frequency: Frequency
  next_date: string
  is_active: boolean
  created_at: string
}

export type RecurringInput = CreateRecurringInput

interface RecurringDto {
  id: string
  accountId: string
  categoryId: string | null
  type: TxType
  amount: string
  description: string | null
  frequency: Frequency
  nextDate: string
  isActive: boolean
  createdAt: string
}

function toRecurringRow(dto: RecurringDto): RecurringRow {
  return {
    id: dto.id,
    account_id: dto.accountId,
    category_id: dto.categoryId,
    type: dto.type,
    amount: fromMoney(dto.amount),
    description: dto.description,
    frequency: dto.frequency,
    next_date: dto.nextDate,
    is_active: dto.isActive,
    created_at: dto.createdAt,
  }
}

export async function listRecurring(): Promise<RecurringRow[]> {
  const rows = await apiFetch<RecurringDto[]>('/api/v1/recurring')
  return rows.map(toRecurringRow)
}

export async function createRecurring(input: RecurringInput): Promise<void> {
  await apiFetch('/api/v1/recurring', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateRecurring(id: string, input: UpdateRecurringInput): Promise<void> {
  await apiFetch(`/api/v1/recurring/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteRecurring(id: string): Promise<void> {
  await apiFetch(`/api/v1/recurring/${id}`, { method: 'DELETE' })
}

export async function setRecurringActive(id: string, isActive: boolean): Promise<void> {
  await apiFetch(`/api/v1/recurring/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  })
}

/**
 * Posts every due rule through the API. Each call creates the transaction,
 * updates the account balance, and advances `next_date` in one database
 * transaction, so a retry cannot double-post.
 *
 * A failing rule does not stop the remaining ones, since each post is
 * independent and idempotent. Failures are collected and thrown afterwards so
 * the UI can report partial generation.
 */
export async function postDueRecurring(due: RecurringRow[]): Promise<void> {
  const failures: Array<{ rule: RecurringRow; error: unknown }> = []

  for (const rule of due) {
    try {
      await apiFetch(`/api/v1/recurring/${rule.id}/post`, { method: 'POST' })
    } catch (error) {
      failures.push({ rule, error })
    }
  }

  if (failures.length === 0) return

  const details = failures
    .map(({ rule, error }) => {
      const label = rule.description?.trim() || rule.id
      const message = error instanceof Error ? error.message : 'Unknown error'
      return `${label}: ${message}`
    })
    .join('; ')

  throw new Error(
    `Could not generate ${failures.length} of ${due.length} recurring transactions. ${details}`,
  )
}
