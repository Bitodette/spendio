import { apiFetch } from '@/lib/api/client'
import { fromMoney } from '@/lib/api/money'
import { listAccountOptions } from '@/lib/api/accounts'
import { listCategories } from '@/lib/api/categories'
import type { AccountType, CategoryRef, TxType } from '@/types/database'
import type { CreateTransactionInput, UpdateTransactionInput } from '@spendio/shared'

export type DateRange = 'today' | 'week' | 'month' | 'all'

export interface TransactionFilters {
  search: string
  accountId: string
  categoryId: string
  range: DateRange
}

export const EMPTY_FILTERS: TransactionFilters = {
  search: '',
  accountId: '',
  categoryId: '',
  range: 'month',
}

export interface Transaction {
  id: string
  account_id: string
  category_id: string | null
  type: TxType
  amount: number
  description: string | null
  date: string
  created_at: string
  category: { name: string } | null
  account: { name: string } | null
}

export interface AccountOption {
  id: string
  name: string
  type: AccountType
}

export type TransactionInput = CreateTransactionInput

interface TransactionDto {
  id: string
  accountId: string
  categoryId: string | null
  type: TxType
  amount: string
  description: string | null
  date: string
  createdAt: string
  category: { name: string } | null
  account: { name: string } | null
}

interface TransactionSummaryDto {
  income: string
  expense: string
  net: string
}

interface TransactionListResponse {
  items: TransactionDto[]
  nextCursor: string | null
  summary: TransactionSummaryDto
}

export interface TransactionSummary {
  income: number
  expense: number
  net: number
}

export interface TransactionPage {
  items: Transaction[]
  nextCursor: string | null
  summary: TransactionSummary
}

interface MutationDto {
  id: string
}

const PAGE_SIZE = 50

function toTransaction(dto: TransactionDto): Transaction {
  return {
    id: dto.id,
    account_id: dto.accountId,
    category_id: dto.categoryId,
    type: dto.type,
    amount: fromMoney(dto.amount),
    description: dto.description,
    date: dto.date,
    created_at: dto.createdAt,
    category: dto.category,
    account: dto.account,
  }
}

export async function fetchTransactionPage(
  filters: TransactionFilters,
  cursor: string | null,
): Promise<TransactionPage> {
  const query = new URLSearchParams({
    range: filters.range,
    limit: String(PAGE_SIZE),
  })
  if (filters.search) query.set('search', filters.search)
  if (filters.accountId) query.set('accountId', filters.accountId)
  if (filters.categoryId) query.set('categoryId', filters.categoryId)
  if (cursor) query.set('cursor', cursor)

  const response = await apiFetch<TransactionListResponse>(`/api/v1/transactions?${query}`)

  return {
    items: response.items.map(toTransaction),
    nextCursor: response.nextCursor,
    summary: {
      income: fromMoney(response.summary.income),
      expense: fromMoney(response.summary.expense),
      net: fromMoney(response.summary.net),
    },
  }
}

export function fetchAccountOptions(): Promise<AccountOption[]> {
  return listAccountOptions()
}

export function fetchCategories(): Promise<CategoryRef[]> {
  return listCategories()
}

export async function createTransaction(input: TransactionInput): Promise<string> {
  const created = await apiFetch<MutationDto>('/api/v1/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return created.id
}

export async function updateTransaction(id: string, input: UpdateTransactionInput): Promise<void> {
  await apiFetch(`/api/v1/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiFetch(`/api/v1/transactions/${id}`, { method: 'DELETE' })
}
