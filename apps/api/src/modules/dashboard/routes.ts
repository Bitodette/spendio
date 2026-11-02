import { Router } from 'express'
import { and, asc, desc, eq, gte, lt, sql } from 'drizzle-orm'
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
  parseNow,
} from '../../lib/dates.js'

const RECENT_LIMIT = 10

const incomeSum = sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`
const expenseSum = sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`

export const dashboardRouter = Router()
dashboardRouter.use(requireAuth)

dashboardRouter.get('/', async (req, res) => {
  const userId = req.auth!.user.id
  const { now: nowParam } = dashboardQuerySchema.parse(req.query)
  const now = parseNow(nowParam)
  const currentMonth = currentMonthBounds(now)

  const [accountRows, recentRows, currentMonthRows, monthlyTotals, dailyTotals, categoryRows] = await Promise.all([
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
          gte(transactions.date, currentMonth.start),
          lt(transactions.date, currentMonth.end),
        ),
      ),

    // All-time monthly totals keep the yearly view complete without shipping
    // every transaction to the browser.
    db
      .select({
        month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
        income: incomeSum,
        expense: expenseSum,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`),

    // Daily totals back the month-to-date comparison and the daily chart.
    db
      .select({
        date: transactions.date,
        income: incomeSum,
        expense: expenseSum,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .groupBy(transactions.date)
      .orderBy(transactions.date),

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
      currentMonth: currentMonthRows,
      monthlyTotals,
      dailyTotals,
      categories: categoryRows,
    }),
  )
})
