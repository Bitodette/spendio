import { Router } from 'express'
import {
  and,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm'
import { z } from 'zod'
import {
  createTransactionSchema,
  transactionCursorSchema,
  transactionDtoSchema,
  transactionFiltersSchema,
  transactionListResponseSchema,
  updateTransactionSchema,
} from '@spendio/shared'
import { parseResponse } from '../../lib/response.js'
import { db } from '../../db/client.js'
import { accounts, categories, transactions } from '../../db/schema.js'
import { requireAuth } from '../../auth/middleware.js'
import { dateWindow } from '../../lib/dates.js'
import { transactionDto } from '../../lib/dto.js'
import { HttpError, notFound } from '../../lib/http-error.js'
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from './service.js'

export const transactionsRouter = Router()
transactionsRouter.use(requireAuth)

function encodeCursor(row: { date: string; createdAtText: string; id: string }): string {
  return Buffer.from(
    JSON.stringify({ date: row.date, createdAt: row.createdAtText, id: row.id }),
  ).toString('base64url')
}

function decodeCursor(value: string) {
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
  } catch {
    throw new HttpError(400, 'INVALID_CURSOR', 'Invalid cursor')
  }
  return transactionCursorSchema.parse(parsed)
}

async function findTransactionWithRelations(userId: string, id: string) {
  const [row] = await db
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

  return row ?? null
}

transactionsRouter.get('/', async (req, res) => {
  const userId = req.auth!.user.id
  const filters = transactionFiltersSchema.parse(req.query)
  const { start, end } = dateWindow(filters.range)

  const baseConditions: SQL[] = [
    eq(transactions.userId, userId),
    gte(transactions.date, start),
    lte(transactions.date, end),
  ]

  if (filters.search) {
    baseConditions.push(ilike(transactions.description, `%${filters.search}%`))
  }
  if (filters.accountId) baseConditions.push(eq(transactions.accountId, filters.accountId))
  if (filters.categoryId) baseConditions.push(eq(transactions.categoryId, filters.categoryId))

  const pageConditions = [...baseConditions]
  if (filters.cursor) {
    const cursor = decodeCursor(filters.cursor)
    pageConditions.push(
      or(
        lt(transactions.date, cursor.date),
        and(
          eq(transactions.date, cursor.date),
          // Compare at Postgres timestamp precision, not JavaScript's
          // millisecond precision, so a page boundary cannot skip a row.
          sql`${transactions.createdAt} < ${cursor.createdAt}::timestamptz`,
        ),
        and(
          eq(transactions.date, cursor.date),
          sql`${transactions.createdAt} = ${cursor.createdAt}::timestamptz`,
          lt(transactions.id, cursor.id),
        ),
      )!,
    )
  }

  const [rows, summaryRows] = await Promise.all([
    db
      .select({
        ...getTableColumns(transactions),
        categoryName: categories.name,
        accountName: accounts.name,
        createdAtText: sql<string>`${transactions.createdAt}::text`,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(...pageConditions))
      .orderBy(
        desc(transactions.date),
        desc(transactions.createdAt),
        desc(transactions.id),
      )
      .limit(filters.limit + 1),

    db
      .select({
        income: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)::text`,
        expense: sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)::text`,
        net: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} when ${transactions.type} = 'expense' then -${transactions.amount} else 0 end), 0)::text`,
      })
      .from(transactions)
      .where(and(...baseConditions)),
  ])

  const page = rows.slice(0, filters.limit)
  const last = page.at(-1)
  const nextCursor = rows.length > filters.limit && last ? encodeCursor(last) : null
  const summary = summaryRows[0] ?? { income: '0.00', expense: '0.00', net: '0.00' }

  res.json(
    parseResponse(transactionListResponseSchema, {
      items: page.map(transactionDto),
      nextCursor,
      summary,
    }),
  )
})

transactionsRouter.get('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  const row = await findTransactionWithRelations(userId, id)
  if (!row) throw notFound('Transaction')
  res.json(parseResponse(transactionDtoSchema, transactionDto(row)))
})

transactionsRouter.post('/', async (req, res) => {
  const userId = req.auth!.user.id
  const input = createTransactionSchema.parse(req.body)
  const row = await createTransaction(userId, input)
  res.status(201).json(parseResponse(transactionDtoSchema, row))
})

transactionsRouter.patch('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)
  const input = updateTransactionSchema.parse(req.body)
  const row = await updateTransaction(userId, id, input)
  res.json(parseResponse(transactionDtoSchema, row))
})

transactionsRouter.delete('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  await deleteTransaction(userId, id)
  res.status(204).end()
})
