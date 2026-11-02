import { format } from 'date-fns'
import { apiFetch } from '@/lib/api/client'
import { fromMoney } from '@/lib/api/money'
import type {
  Account,
  AccountRef,
  AccountType,
  CategoryWithColor,
  DailyTotal,
  MonthlyTotal,
  RecentTransaction,
  TxType,
  TxnAmount,
} from '@/types/database'

export const RECENT_LIMIT = 10

export interface DashboardData {
  accounts: Account[]
  recent: RecentTransaction[]
  // Current-month rows feed the category breakdown. Historical trend data is
  // aggregated by the API so every year stays available without loading every
  // transaction into the browser.
  currentMonth: TxnAmount[]
  monthlyTotals: MonthlyTotal[]
  dailyTotals: DailyTotal[]
  categories: CategoryWithColor[]
}

interface DashboardAccountDto {
  id: string
  name: string
  type: AccountType
  balance: string
  icon: string | null
  color: string | null
  sortOrder: number
}

interface DashboardRecentDto {
  id: string
  amount: string
  type: TxType
  description: string | null
  date: string
  categoryId: string | null
  account: AccountRef | null
}

interface DashboardTxnAmountDto {
  amount: string
  type: TxType
  date: string
  categoryId: string | null
}

interface DashboardMonthlyTotalDto {
  month: string
  income: string
  expense: string
}

interface DashboardDailyTotalDto {
  date: string
  income: string
  expense: string
}

interface DashboardCategoryDto {
  id: string
  name: string
  color: string | null
  parentId: string | null
  type: TxType
}

interface DashboardResponseDto {
  accounts: DashboardAccountDto[]
  recent: DashboardRecentDto[]
  currentMonth: DashboardTxnAmountDto[]
  monthlyTotals: DashboardMonthlyTotalDto[]
  dailyTotals: DashboardDailyTotalDto[]
  categories: DashboardCategoryDto[]
}

export async function fetchDashboardData(now = new Date()): Promise<DashboardData> {
  const query = new URLSearchParams({ now: format(now, 'yyyy-MM-dd') })
  const data = await apiFetch<DashboardResponseDto>(`/api/v1/dashboard?${query}`)

  return {
    accounts: data.accounts.map(account => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: fromMoney(account.balance),
      icon: account.icon,
      color: account.color,
      sort_order: account.sortOrder,
    })),
    recent: data.recent.map(transaction => ({
      id: transaction.id,
      amount: fromMoney(transaction.amount),
      type: transaction.type,
      description: transaction.description,
      date: transaction.date,
      category_id: transaction.categoryId,
      account: transaction.account,
    })),
    currentMonth: data.currentMonth.map(transaction => ({
      amount: fromMoney(transaction.amount),
      type: transaction.type,
      date: transaction.date,
      category_id: transaction.categoryId,
    })),
    monthlyTotals: data.monthlyTotals.map(total => ({
      month: total.month,
      income: fromMoney(total.income),
      expense: fromMoney(total.expense),
    })),
    dailyTotals: data.dailyTotals.map(total => ({
      date: total.date,
      income: fromMoney(total.income),
      expense: fromMoney(total.expense),
    })),
    categories: data.categories.map(category => ({
      id: category.id,
      name: category.name,
      color: category.color,
      parent_id: category.parentId,
      type: category.type,
    })),
  }
}
