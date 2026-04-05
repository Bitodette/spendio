import { Router } from 'express'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  createRecurringSchema,
  postRecurringResponseSchema,
  recurringDtoSchema,
  recurringListResponseSchema,
  updateRecurringSchema,
} from '@spendio/shared'
import { parseResponse } from '../../lib/response.js'
import { db } from '../../db/client.js'
import { accounts, categories, recurringTransactions, type RecurringTransaction } from '../../db/schema.js'
import { requireAuth } from '../../auth/middleware.js'
import { nextFrequencyDate, todayIso } from '../../lib/dates.js'
import { iso } from '../../lib/dto.js'
import { conflict, notFound } from '../../lib/http-error.js'
import {
  assertCategoryForType,
  createTransactionRecord,
  lockAccounts,
} from '../transactions/service.js'

export const recurringRouter = Router()
recurringRouter.use(requireAuth)

type RecurringExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function assertAccount(tx: RecurringExecutor, userId: string, accountId: string): Promise<void> {
  const [row] = await tx
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.id, accountId)))
    .limit(1)

  if (!row) throw notFound('Account')
}

function toRecurringDto(row: RecurringTransaction) {
  return {
    id: row.id,
    userId: row.userId,
    accountId: row.accountId,
    categoryId: row.categoryId,
    type: row.type,
    amount: row.amount,
    description: row.description,
    frequency: row.frequency,
    nextDate: row.nextDate,
    isActive: row.isActive,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

recurringRouter.get('/', async (req, res) => {
  const userId = req.auth!.user.id
  const rows = await db
    .select()
    .from(recurringTransactions)
    .where(eq(recurringTransactions.userId, userId))
    .orderBy(asc(recurringTransactions.nextDate))

  res.json(parseResponse(recurringListResponseSchema, rows.map(toRecurringDto)))
})

recurringRouter.get('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  const [row] = await db
    .select()
    .from(recurringTransactions)
    .where(and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.id, id)))
    .limit(1)

  if (!row) throw notFound('Recurring transaction')
  res.json(parseResponse(recurringDtoSchema, toRecurringDto(row)))
})

recurringRouter.post('/', async (req, res) => {
  const userId = req.auth!.user.id
  const input = createRecurringSchema.parse(req.body)

  const row = await db.transaction(async tx => {
    await assertAccount(tx, userId, input.accountId)
    await assertCategoryForType(tx, userId, input.categoryId ?? null, input.type)

    const [created] = await tx
      .insert(recurringTransactions)
      .values({
        userId,
        accountId: input.accountId,
        categoryId: input.categoryId ?? null,
        type: input.type,
        amount: input.amount,
        description: input.description ?? null,
        frequency: input.frequency,
        nextDate: input.nextDate,
      })
      .returning()
    return created
  })

  res.status(201).json(parseResponse(recurringDtoSchema, toRecurringDto(row)))
})

recurringRouter.patch('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)
  const input = updateRecurringSchema.parse(req.body)

  const row = await db.transaction(async tx => {
    const [existing] = await tx
      .select()
      .from(recurringTransactions)
      .where(and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.id, id)))
      .limit(1)

    if (!existing) throw notFound('Recurring transaction')

    const nextAccountId = input.accountId ?? existing.accountId
    const nextCategoryId =
      input.categoryId === undefined ? existing.categoryId : input.categoryId
    const nextType = input.type ?? existing.type

    await assertAccount(tx, userId, nextAccountId)
    await assertCategoryForType(tx, userId, nextCategoryId, nextType)

    const changes = Object.fromEntries(
      Object.entries({
        accountId: input.accountId,
        categoryId: input.categoryId,
        type: input.type,
        amount: input.amount,
        description: input.description,
        frequency: input.frequency,
        nextDate: input.nextDate,
        isActive: input.isActive,
      }).filter(([, value]) => value !== undefined),
    )

    const [updated] = await tx
      .update(recurringTransactions)
      .set(changes)
      .where(and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.id, id)))
      .returning()
    return updated
  })

  res.json(parseResponse(recurringDtoSchema, toRecurringDto(row)))
})

recurringRouter.delete('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  const [row] = await db
    .delete(recurringTransactions)
    .where(and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.id, id)))
    .returning({ id: recurringTransactions.id })

  if (!row) throw notFound('Recurring transaction')
  res.status(204).end()
})

/**
 * Posts one due rule. The rule row is locked, the transaction is inserted, the
 * balance is changed, and `next_date` advances in a single database
 * transaction — a retry cannot double-post and a failure cannot move money
 * without recording it.
 */
recurringRouter.post('/:id/post', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)
  const today = todayIso()

  const result = await db.transaction(async tx => {
    const [rule] = await tx
      .select()
      .from(recurringTransactions)
      .where(and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.id, id)))
      .limit(1)
      .for('update')

    if (!rule) throw notFound('Recurring transaction')
    if (!rule.isActive) {
      throw conflict('RECURRING_INACTIVE', 'This recurring transaction is inactive')
    }
    if (rule.nextDate > today) {
      throw conflict('RECURRING_NOT_DUE', 'This recurring transaction is not due yet')
    }

    await lockAccounts(tx, userId, [rule.accountId])
    await assertCategoryForType(tx, userId, rule.categoryId, rule.type)

    const description = rule.description
      ? `${rule.description} (otomatis)`
      : '(otomatis)'

    const transaction = await createTransactionRecord(tx, userId, {
      accountId: rule.accountId,
      categoryId: rule.categoryId,
      type: rule.type,
      amount: rule.amount,
      description,
      date: rule.nextDate,
    })

    const [updated] = await tx
      .update(recurringTransactions)
      .set({ nextDate: nextFrequencyDate(rule.nextDate, rule.frequency) })
      .where(
        and(
          eq(recurringTransactions.userId, userId),
          eq(recurringTransactions.id, rule.id),
        ),
      )
      .returning()

    return { recurring: updated, transaction }
  })

  res.json(
    parseResponse(postRecurringResponseSchema, {
      recurring: toRecurringDto(result.recurring),
      transaction: result.transaction,
    }),
  )
})
