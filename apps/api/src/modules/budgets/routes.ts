import { Router } from 'express'
import { and, asc, eq, getTableColumns, sql } from 'drizzle-orm'
import { z } from 'zod'
import {
  budgetDtoSchema,
  budgetListResponseSchema,
  budgetQuerySchema,
  centsToMoney,
  createBudgetSchema,
  moneyToCents,
  normalizeMoney,
  updateBudgetSchema,
} from '@spendio/shared'
import { parseResponse } from '../../lib/response.js'
import { db } from '../../db/client.js'
import { budgets, categories, transactions, type Budget } from '../../db/schema.js'
import { requireAuth } from '../../auth/middleware.js'
import { budgetWindow } from '../../lib/dates.js'
import { iso } from '../../lib/dto.js'
import { notFound, unprocessable } from '../../lib/http-error.js'

export const budgetsRouter = Router()
budgetsRouter.use(requireAuth)

type BudgetExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function assertExpenseCategory(
  tx: BudgetExecutor,
  userId: string,
  categoryId: string,
): Promise<void> {
  const [category] = await tx
    .select({ id: categories.id, type: categories.type })
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, categoryId)))
    .limit(1)

  if (!category) throw notFound('Category')
  if (category.type !== 'expense') {
    throw unprocessable('CATEGORY_TYPE_MISMATCH', 'Budgets require an expense category')
  }
}

function toBudgetDto(
  row: Budget & {
    categoryName: string | null
    categoryColor: string | null
    categoryType: string | null
  },
) {
  return {
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    amount: row.amount,
    period: row.period,
    startDate: row.startDate,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    category: row.categoryName
      ? {
          id: row.categoryId,
          name: row.categoryName,
          color: row.categoryColor,
          type: row.categoryType ?? '',
        }
      : null,
  }
}

budgetsRouter.get('/', async (req, res) => {
  const userId = req.auth!.user.id
  const { period, monthOffset } = budgetQuerySchema.parse(req.query)
  const window = budgetWindow(period, monthOffset)

  const rows = await db
    .select({
      ...getTableColumns(budgets),
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryType: categories.type,
    })
    .from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(eq(budgets.userId, userId), eq(budgets.period, period)))
    .orderBy(asc(budgets.createdAt))

  const sums = await db
    .select({
      categoryId: transactions.categoryId,
      spent: sql<string>`coalesce(sum(${transactions.amount}), 0)::text`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        sql`${transactions.date} >= ${window.start}`,
        sql`${transactions.date} <= ${window.end}`,
      ),
    )
    .groupBy(transactions.categoryId)

  const spentByCategory = new Map(
    sums.map(row => [row.categoryId, normalizeMoney(row.spent)]),
  )

  const enriched = rows.map(row => {
    const dto = toBudgetDto(row)
    const spent = spentByCategory.get(row.categoryId) ?? '0.00'
    const amountCents = moneyToCents(row.amount)
    const spentCents = moneyToCents(spent)
    return {
      ...dto,
      spent,
      remaining: centsToMoney(amountCents - spentCents),
      percentage: Number((spentCents * 100n + amountCents / 2n) / amountCents),
    }
  })

  enriched.sort((left, right) => right.percentage - left.percentage)
  res.json(parseResponse(budgetListResponseSchema, enriched))
})

budgetsRouter.get('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  const [row] = await db
    .select({
      ...getTableColumns(budgets),
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryType: categories.type,
    })
    .from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(and(eq(budgets.userId, userId), eq(budgets.id, id)))
    .limit(1)

  if (!row) throw notFound('Budget')
  res.json(parseResponse(budgetDtoSchema, toBudgetDto(row)))
})

budgetsRouter.post('/', async (req, res) => {
  const userId = req.auth!.user.id
  const input = createBudgetSchema.parse(req.body)

  const row = await db.transaction(async tx => {
    await assertExpenseCategory(tx, userId, input.categoryId)
    const [created] = await tx
      .insert(budgets)
      .values({
        userId,
        categoryId: input.categoryId,
        amount: input.amount,
        period: input.period,
        startDate: input.startDate,
      })
      .returning()
    return created
  })

  const [category] = await db
    .select({ id: categories.id, name: categories.name, color: categories.color, type: categories.type })
    .from(categories)
    .where(eq(categories.id, row.categoryId))
    .limit(1)

  res.status(201).json(
    parseResponse(budgetDtoSchema, {
      ...toBudgetDto({
        ...row,
        categoryName: category?.name ?? null,
        categoryColor: category?.color ?? null,
        categoryType: category?.type ?? null,
      }),
    }),
  )
})

budgetsRouter.patch('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)
  const input = updateBudgetSchema.parse(req.body)

  const row = await db.transaction(async tx => {
    const [existing] = await tx
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.id, id)))
      .limit(1)

    if (!existing) throw notFound('Budget')
    if (input.categoryId) await assertExpenseCategory(tx, userId, input.categoryId)

    const changes = Object.fromEntries(
      Object.entries({
        categoryId: input.categoryId,
        amount: input.amount,
        period: input.period,
        startDate: input.startDate,
      }).filter(([, value]) => value !== undefined),
    )

    const [updated] = await tx
      .update(budgets)
      .set(changes)
      .where(and(eq(budgets.userId, userId), eq(budgets.id, id)))
      .returning()
    return updated
  })

  const [category] = await db
    .select({ id: categories.id, name: categories.name, color: categories.color, type: categories.type })
    .from(categories)
    .where(eq(categories.id, row.categoryId))
    .limit(1)

  res.json(
    parseResponse(budgetDtoSchema, 
      toBudgetDto({
        ...row,
        categoryName: category?.name ?? null,
        categoryColor: category?.color ?? null,
        categoryType: category?.type ?? null,
      }),
    ),
  )
})

budgetsRouter.delete('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  const [row] = await db
    .delete(budgets)
    .where(and(eq(budgets.userId, userId), eq(budgets.id, id)))
    .returning({ id: budgets.id })

  if (!row) throw notFound('Budget')
  res.status(204).end()
})
