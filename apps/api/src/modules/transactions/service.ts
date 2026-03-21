import { and, asc, eq, getTableColumns, inArray, sql } from 'drizzle-orm'
import type { CreateTransactionInput, TransactionDto, UpdateTransactionInput } from '@spendio/shared'
import { addMoney } from '@spendio/shared'
import { db, type Database } from '../../db/client.js'
import {
  accounts,
  categories,
  transactions,
  type Account,
  type Transaction,
} from '../../db/schema.js'
import { notFound, unprocessable } from '../../lib/http-error.js'
import { todayIso } from '../../lib/dates.js'
import { transactionDto } from '../../lib/dto.js'

type TransactionCallback = Parameters<Database['transaction']>[0]
export type DbExecutor = Parameters<TransactionCallback>[0]

export function signedAmount(type: string, amount: string): string {
  return type === 'expense' ? `-${amount}` : amount
}

export function inverseSignedAmount(type: string, amount: string): string {
  return type === 'expense' ? amount : `-${amount}`
}

/**
 * Locks every account involved in a write, always in id order, so transfers
 * and edits that touch two accounts cannot deadlock.
 */
export async function lockAccounts(
  tx: DbExecutor,
  userId: string,
  ids: string[],
): Promise<Map<string, Account>> {
  const unique = [...new Set(ids)].sort()
  const rows = await tx
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), inArray(accounts.id, unique)))
    .orderBy(asc(accounts.id))
    .for('update')

  if (rows.length !== unique.length) throw notFound('Account')
  return new Map(rows.map(row => [row.id, row]))
}

export async function assertCategoryForType(
  tx: DbExecutor,
  userId: string,
  categoryId: string | null,
  type: string,
): Promise<void> {
  if (!categoryId) return

  const [category] = await tx
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
    .limit(1)

  if (!category) throw notFound('Category')
  if (category.type !== type) {
    throw unprocessable('CATEGORY_TYPE_MISMATCH', 'Category type does not match transaction type')
  }
}

/**
 * The only place a transaction changes an account balance. SQL performs the
 * addition, so concurrent writers cannot lose an update and no float
 * arithmetic happens in JavaScript.
 */
export async function adjustBalance(
  tx: DbExecutor,
  accountId: string,
  delta: string,
): Promise<void> {
  const [updated] = await tx
    .update(accounts)
    .set({ balance: sql`${accounts.balance} + ${delta}::numeric` })
    .where(eq(accounts.id, accountId))
    .returning({ id: accounts.id })

  if (!updated) throw notFound('Account')
}

export async function fetchTransactionDto(
  tx: DbExecutor,
  userId: string,
  id: string,
): Promise<TransactionDto> {
  const [row] = await tx
    .select({
      ...getTableColumns(transactions),
      categoryName: categories.name,
      accountName: accounts.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(and(eq(transactions.userId, userId), eq(transactions.id, id)))
    .limit(1)

  if (!row) throw notFound('Transaction')
  return transactionDto(row)
}

export async function createTransactionRecord(
  tx: DbExecutor,
  userId: string,
  input: {
    accountId: string
    categoryId?: string | null
    type: 'income' | 'expense'
    amount: string
    description?: string | null
    date: string
  },
): Promise<TransactionDto> {
  const [created] = await tx
    .insert(transactions)
    .values({
      userId,
      accountId: input.accountId,
      categoryId: input.categoryId ?? null,
      type: input.type,
      amount: input.amount,
      description: input.description ?? null,
      date: input.date,
    })
    .returning()

  await adjustBalance(tx, created.accountId, signedAmount(created.type, created.amount))
  return fetchTransactionDto(tx, userId, created.id)
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
): Promise<TransactionDto> {
  return db.transaction(async tx => {
    await lockAccounts(tx, userId, [input.accountId])
    await assertCategoryForType(tx, userId, input.categoryId ?? null, input.type)
    return createTransactionRecord(tx, userId, input)
  })
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: UpdateTransactionInput,
): Promise<TransactionDto> {
  return db.transaction(async tx => {
    const [existing] = await tx
      .select()
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.id, id)))
      .limit(1)
      .for('update')

    if (!existing) throw notFound('Transaction')

    const next = {
      accountId: input.accountId ?? existing.accountId,
      categoryId: input.categoryId === undefined ? existing.categoryId : input.categoryId,
      type: input.type ?? existing.type,
      amount: input.amount ?? existing.amount,
      description: input.description === undefined ? existing.description : input.description,
      date: input.date ?? existing.date,
    }

    await lockAccounts(tx, userId, [existing.accountId, next.accountId])
    await assertCategoryForType(tx, userId, next.categoryId, next.type)

    const [updated] = await tx
      .update(transactions)
      .set(next)
      .where(and(eq(transactions.userId, userId), eq(transactions.id, id)))
      .returning()

    if (!updated) throw notFound('Transaction')

    await adjustBalance(tx, existing.accountId, inverseSignedAmount(existing.type, existing.amount))
    await adjustBalance(tx, next.accountId, signedAmount(next.type, next.amount))

    return fetchTransactionDto(tx, userId, id)
  })
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  await db.transaction(async tx => {
    const [existing] = await tx
      .select()
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.id, id)))
      .limit(1)
      .for('update')

    if (!existing) throw notFound('Transaction')

    await lockAccounts(tx, userId, [existing.accountId])
    await tx
      .delete(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.id, id)))
    await adjustBalance(
      tx,
      existing.accountId,
      inverseSignedAmount(existing.type, existing.amount),
    )
  })
}

export async function transferBetweenAccounts(
  userId: string,
  input: { fromId: string; toId: string; amount: string; fee: string; description: string },
): Promise<{ from: TransactionDto; to: TransactionDto }> {
  return db.transaction(async tx => {
    const accountMap = await lockAccounts(tx, userId, [input.fromId, input.toId])
    const fromAccount = accountMap.get(input.fromId)!
    const toAccount = accountMap.get(input.toId)!

    const note = input.description.trim() || 'Transfer'
    const total = addMoney(input.amount, input.fee)
    const today = todayIso()

    const [fromRow] = await tx
      .insert(transactions)
      .values({
        userId,
        accountId: input.fromId,
        type: 'expense',
        amount: total,
        description: `${note} → ${toAccount.name}`,
        date: today,
      })
      .returning()

    const [toRow] = await tx
      .insert(transactions)
      .values({
        userId,
        accountId: input.toId,
        type: 'income',
        amount: input.amount,
        description: `${note} ← ${fromAccount.name}`,
        date: today,
      })
      .returning()

    await adjustBalance(tx, input.fromId, `-${total}`)
    await adjustBalance(tx, input.toId, input.amount)

    return {
      from: await fetchTransactionDto(tx, userId, fromRow.id),
      to: await fetchTransactionDto(tx, userId, toRow.id),
    }
  })
}

export type { Transaction }
