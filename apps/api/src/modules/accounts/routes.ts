import { Router } from 'express'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import {
  accountDtoSchema,
  accountListResponseSchema,
  accountOptionListResponseSchema,
  createAccountSchema,
  reorderAccountsSchema,
  updateAccountSchema,
} from '@spendio/shared'
import { parseResponse } from '../../lib/response.js'
import { db } from '../../db/client.js'
import { accounts } from '../../db/schema.js'
import { requireAuth } from '../../auth/middleware.js'
import { notFound } from '../../lib/http-error.js'
import { accountDto } from '../../lib/dto.js'

export const accountsRouter = Router()
accountsRouter.use(requireAuth)

const listQuerySchema = z.object({
  view: z.enum(['options']).optional(),
})

accountsRouter.get('/', async (req, res) => {
  const userId = req.auth!.user.id
  const { view } = listQuerySchema.parse(req.query)

  if (view === 'options') {
    const rows = await db
      .select({ id: accounts.id, name: accounts.name, type: accounts.type })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(asc(accounts.sortOrder), asc(accounts.createdAt))

    res.json(parseResponse(accountOptionListResponseSchema, rows))
    return
  }

  const rows = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, userId))
    .orderBy(asc(accounts.sortOrder), asc(accounts.createdAt))

  res.json(parseResponse(accountListResponseSchema, rows.map(accountDto)))
})

accountsRouter.get('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  const [row] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.id, id)))
    .limit(1)

  if (!row) throw notFound('Account')
  res.json(parseResponse(accountDtoSchema, accountDto(row)))
})

accountsRouter.post('/', async (req, res) => {
  const userId = req.auth!.user.id
  const input = createAccountSchema.parse(req.body)

  const [row] = await db.transaction(async tx => {
    let sortOrder = input.sortOrder
    if (sortOrder === undefined) {
      const [next] = await tx
        .select({ value: sql<number>`coalesce(max(${accounts.sortOrder}), -1) + 1` })
        .from(accounts)
        .where(eq(accounts.userId, userId))
      sortOrder = Number(next?.value ?? 0)
    }

    return tx
      .insert(accounts)
      .values({
        userId,
        name: input.name,
        type: input.type,
        balance: input.balance,
        icon: input.icon ?? null,
        color: input.color ?? null,
        sortOrder,
      })
      .returning()
  })

  res.status(201).json(parseResponse(accountDtoSchema, accountDto(row)))
})

accountsRouter.put('/order', async (req, res) => {
  const userId = req.auth!.user.id
  const { ids } = reorderAccountsSchema.parse(req.body)

  await db.transaction(async tx => {
    const rows = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.userId, userId), inArray(accounts.id, ids)))

    if (rows.length !== ids.length) throw notFound('Account')

    for (const [index, id] of ids.entries()) {
      await tx
        .update(accounts)
        .set({ sortOrder: index })
        .where(and(eq(accounts.userId, userId), eq(accounts.id, id)))
    }
  })

  res.status(204).end()
})

accountsRouter.patch('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)
  const input = updateAccountSchema.parse(req.body)

  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  )

  const [row] = await db
    .update(accounts)
    .set(changes)
    .where(and(eq(accounts.userId, userId), eq(accounts.id, id)))
    .returning()

  if (!row) throw notFound('Account')
  res.json(parseResponse(accountDtoSchema, accountDto(row)))
})

accountsRouter.delete('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  const [row] = await db
    .delete(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.id, id)))
    .returning({ id: accounts.id })

  if (!row) throw notFound('Account')

  res.status(204).end()
})
