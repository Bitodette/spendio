import type { Account, Category, Transaction } from '../db/schema.js'

export function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

export function accountDto(row: Account) {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    type: row.type,
    balance: row.balance,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sortOrder,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

export function categoryDto(row: Category) {
  return {
    id: row.id,
    userId: row.userId,
    parentId: row.parentId,
    name: row.name,
    icon: row.icon,
    color: row.color,
    type: row.type,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

type TransactionWithRelations = Transaction & {
  categoryName?: string | null
  accountName?: string | null
}

export function transactionDto(row: TransactionWithRelations) {
  return {
    id: row.id,
    userId: row.userId,
    accountId: row.accountId,
    categoryId: row.categoryId,
    type: row.type,
    amount: row.amount,
    description: row.description,
    date: row.date,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    category: row.categoryName ? { name: row.categoryName } : null,
    account: row.accountName ? { name: row.accountName } : null,
  }
}
