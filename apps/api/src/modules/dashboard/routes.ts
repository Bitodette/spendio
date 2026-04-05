import { Router } from 'express'
import { and, asc, desc, eq, gte, lt } from 'drizzle-orm'
import {
  dashboardQuerySchema,
  dashboardResponseSchema,
} from '@spendio/shared'
import { parseResponse } from '../../lib/response.js'
import { db } from '../../db/client.js'
import { accounts, categories, transactions } from '../../db/schema.js'
import { requireAuth } from '../../auth/middleware.js'
import {
  currentMonthBounds,
  dashboardWindowStart,
  parseNow,
} from '../../lib/dates.js'

/** Mirrors the web's `MONTH_WINDOW`; the trend chart depends on this window. */
const MONTH_WINDOW = 6
const RECENT_LIMIT = 10

export const dashboardRouter = Router()
dashboardRouter.use(requireAuth)

dashboardRouter.get('/', async (req, res) => {
  const userId = req.auth!.user.id
  const { now: nowParam } = dashboardQuerySchema.parse(req.query)
  const now = parseNow(nowParam)
  const currentMonth = currentMonthBounds(now)
  const trendStart = dashboardWindowStart(MONTH_WINDOW, now)

  const [accountRows, recentRows, monthlyRows, categoryRows] = await Promise.all([
    db
      .select({
        id: accounts.id,
        name: accounts.name,
        type: accounts.type,
        balance: accounts.balance,
        icon: accounts.icon,
        color: accounts.color,
        sortOrder: accounts.sortOrder,
      })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(asc(accounts.sortOrder), asc(accounts.createdAt)),

    db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        date: transactions.date,
        categoryId: transactions.categoryId,
        accountName: accounts.name,
        accountIcon: accounts.icon,
        accountColor: accounts.color,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, currentMonth.start),
          lt(transactions.date, currentMonth.end),
        ),
      )
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(RECENT_LIMIT),

    db
      .select({
        amount: transactions.amount,
        type: transactions.type,
        date: transactions.date,
        categoryId: transactions.categoryId,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, trendStart),
        ),
      ),

    db
      .select({
        id: categories.id,
        name: categories.name,
        color: categories.color,
        parentId: categories.parentId,
        type: categories.type,
      })
      .from(categories)
      .where(eq(categories.userId, userId)),
  ])

  const recent = recentRows.map(row => ({
    id: row.id,
    amount: row.amount,
    type: row.type,
    description: row.description,
    date: row.date,
    categoryId: row.categoryId,
    account: row.accountName
      ? { name: row.accountName, icon: row.accountIcon, color: row.accountColor }
      : null,
  }))

  res.json(
    parseResponse(dashboardResponseSchema, {
      accounts: accountRows,
      recent,
      allMonthly: monthlyRows,
      categories: categoryRows,
    }),
  )
})
