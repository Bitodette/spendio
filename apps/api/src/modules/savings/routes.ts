import { Router } from 'express'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import {
  contributeSavingsGoalSchema,
  createSavingsGoalSchema,
  savingsGoalDtoSchema,
  savingsGoalListResponseSchema,
  updateSavingsGoalSchema,
} from '@spendio/shared'
import { parseResponse } from '../../lib/response.js'
import { db } from '../../db/client.js'
import { savingsGoals, type SavingsGoal } from '../../db/schema.js'
import { requireAuth } from '../../auth/middleware.js'
import { iso } from '../../lib/dto.js'
import { notFound } from '../../lib/http-error.js'

export const savingsRouter = Router()
savingsRouter.use(requireAuth)

function toSavingsDto(row: SavingsGoal) {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    targetAmount: row.targetAmount,
    currentAmount: row.currentAmount,
    deadline: row.deadline,
    icon: row.icon,
    color: row.color,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

savingsRouter.get('/', async (req, res) => {
  const userId = req.auth!.user.id
  const rows = await db
    .select()
    .from(savingsGoals)
    .where(eq(savingsGoals.userId, userId))
    .orderBy(desc(savingsGoals.createdAt))

  res.json(parseResponse(savingsGoalListResponseSchema, rows.map(toSavingsDto)))
})

savingsRouter.get('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  const [row] = await db
    .select()
    .from(savingsGoals)
    .where(and(eq(savingsGoals.userId, userId), eq(savingsGoals.id, id)))
    .limit(1)

  if (!row) throw notFound('Savings goal')
  res.json(parseResponse(savingsGoalDtoSchema, toSavingsDto(row)))
})

savingsRouter.post('/', async (req, res) => {
  const userId = req.auth!.user.id
  const input = createSavingsGoalSchema.parse(req.body)

  const [row] = await db
    .insert(savingsGoals)
    .values({
      userId,
      name: input.name,
      targetAmount: input.targetAmount,
      deadline: input.deadline ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
    })
    .returning()

  res.status(201).json(parseResponse(savingsGoalDtoSchema, toSavingsDto(row)))
})

savingsRouter.patch('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)
  const input = updateSavingsGoalSchema.parse(req.body)

  const changes = Object.fromEntries(
    Object.entries({
      name: input.name,
      targetAmount: input.targetAmount,
      deadline: input.deadline,
      icon: input.icon,
      color: input.color,
    }).filter(([, value]) => value !== undefined),
  )

  const [row] = await db
    .update(savingsGoals)
    .set(changes)
    .where(and(eq(savingsGoals.userId, userId), eq(savingsGoals.id, id)))
    .returning()

  if (!row) throw notFound('Savings goal')
  res.json(parseResponse(savingsGoalDtoSchema, toSavingsDto(row)))
})

/** Adds to the saved amount with `current_amount + $n` in SQL, never a stale read. */
savingsRouter.post('/:id/contribute', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)
  const input = contributeSavingsGoalSchema.parse(req.body)

  const [row] = await db
    .update(savingsGoals)
    .set({
      currentAmount: sql`${savingsGoals.currentAmount} + ${input.amount}::numeric`,
    })
    .where(and(eq(savingsGoals.userId, userId), eq(savingsGoals.id, id)))
    .returning()

  if (!row) throw notFound('Savings goal')
  res.json(parseResponse(savingsGoalDtoSchema, toSavingsDto(row)))
})

savingsRouter.delete('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  const [row] = await db
    .delete(savingsGoals)
    .where(and(eq(savingsGoals.userId, userId), eq(savingsGoals.id, id)))
    .returning({ id: savingsGoals.id })

  if (!row) throw notFound('Savings goal')
  res.status(204).end()
})
