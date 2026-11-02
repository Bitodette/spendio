/**
 * Row shapes used by the pages. `src/lib/api/*` maps the API's camelCase DTOs
 * and decimal strings into these snake_case/number shapes.
 */

export type TxType = 'income' | 'expense'
export type AccountType = 'bank' | 'e-wallet' | 'cash'

export interface CategoryRef {
  id: string
  name: string
  parent_id: string | null
  type: TxType
}

export interface CategoryWithColor extends CategoryRef {
  color: string | null
}

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  icon: string | null
  color: string | null
  sort_order: number
}

export interface AccountRef {
  name: string
  icon: string | null
  color: string | null
}

export interface TxnAmount {
  amount: number
  type: TxType
  date: string
  category_id: string | null
}

export interface MonthlyTotal {
  month: string
  income: number
  expense: number
}

export interface DailyTotal {
  date: string
  income: number
  expense: number
}

export interface RecentTransaction extends TxnAmount {
  id: string
  description: string | null
  account: AccountRef | null
}
