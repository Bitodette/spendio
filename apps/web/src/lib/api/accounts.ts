import { apiFetch } from '@/lib/api/client'
import { fromMoney } from '@/lib/api/money'
import type { AccountType } from '@/types/database'
import type { CreateAccountInput, UpdateAccountInput } from '@spendio/shared'

export interface AccountRow {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  icon: string | null
  color: string | null
  sort_order: number
  created_at: string
}

export interface AccountOptionRow {
  id: string
  name: string
  type: AccountType
}

export type AccountInput = CreateAccountInput

interface AccountDto {
  id: string
  userId: string
  name: string
  type: AccountType
  balance: string
  icon: string | null
  color: string | null
  sortOrder: number
  createdAt: string
}

function toAccountRow(dto: AccountDto): AccountRow {
  return {
    id: dto.id,
    user_id: dto.userId,
    name: dto.name,
    type: dto.type,
    balance: fromMoney(dto.balance),
    icon: dto.icon,
    color: dto.color,
    sort_order: dto.sortOrder,
    created_at: dto.createdAt,
  }
}

export async function listAccounts(): Promise<AccountRow[]> {
  const rows = await apiFetch<AccountDto[]>('/api/v1/accounts')
  return rows.map(toAccountRow)
}

export async function listAccountOptions(): Promise<AccountOptionRow[]> {
  return apiFetch<AccountOptionRow[]>('/api/v1/accounts?view=options')
}

export async function createAccount(input: AccountInput): Promise<void> {
  await apiFetch('/api/v1/accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateAccount(id: string, input: UpdateAccountInput): Promise<void> {
  await apiFetch(`/api/v1/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteAccount(id: string): Promise<void> {
  await apiFetch(`/api/v1/accounts/${id}`, { method: 'DELETE' })
}

/** Persists the drag-and-drop order as a contiguous `sort_order` sequence. */
export async function reorderAccounts(ids: string[]): Promise<void> {
  await apiFetch('/api/v1/accounts/order', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  })
}
