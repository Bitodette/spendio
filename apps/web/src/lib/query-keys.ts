import type { TransactionFilters } from '@/lib/api/transactions'

const accounts = {
  all: ['accounts'] as const,
  list: ['accounts', 'list'] as const,
  options: ['accounts', 'options'] as const,
}

const categories = {
  all: ['categories'] as const,
  list: ['categories', 'list'] as const,
  expense: ['categories', 'expense'] as const,
}

const budgets = {
  all: ['budgets'] as const,
  list: (period: 'monthly' | 'yearly', monthOffset: number) =>
    ['budgets', period, monthOffset] as const,
}

const transactions = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters) => ['transactions', 'list', filters] as const,
  options: ['transactions', 'options'] as const,
}

const recurring = {
  all: ['recurring'] as const,
  list: ['recurring', 'list'] as const,
}

const savings = {
  all: ['savings'] as const,
  list: ['savings', 'list'] as const,
}

const preferences = {
  all: ['preferences'] as const,
  detail: (key: string) => ['preferences', key] as const,
}

export const queryKeys = {
  accounts,
  categories,
  budgets,
  transactions,
  recurring,
  savings,
  dashboard: ['dashboard'] as const,
  preferences,
}
