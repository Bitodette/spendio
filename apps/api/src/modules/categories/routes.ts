import { Router } from 'express'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  categoryDtoSchema,
  categoryListResponseSchema,
  categoryOptionListResponseSchema,
  createCategorySchema,
  updateCategorySchema,
} from '@spendio/shared'
import { parseResponse } from '../../lib/response.js'
import { db } from '../../db/client.js'
import { categories } from '../../db/schema.js'
import { requireAuth } from '../../auth/middleware.js'
import { notFound, unprocessable } from '../../lib/http-error.js'
import { categoryDto } from '../../lib/dto.js'

export const categoriesRouter = Router()
categoriesRouter.use(requireAuth)

const listQuerySchema = z.object({
  view: z.enum(['options']).optional(),
  type: z.enum(['income', 'expense']).optional(),
})

type CategoryExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Categories are one level deep. A parent must belong to the same user, have
 * the same income/expense type, and must not itself be a child.
 */
async function assertParent(
  tx: CategoryExecutor,
  userId: string,
  parentId: string | null | undefined,
  type: string,
  selfId?: string,
): Promise<void> {
  if (!parentId) return
  if (selfId && parentId === selfId) {
    throw unprocessable('INVALID_PARENT', 'A category cannot be its own parent')
  }

  const [parent] = await tx
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, parentId)))
    .limit(1)

  if (!parent) throw notFound('Parent category')
  if (parent.type !== type) {
    throw unprocessable('PARENT_TYPE_MISMATCH', 'Parent category type does not match')
  }
  if (parent.parentId) {
    throw unprocessable('NESTED_CATEGORY', 'Categories can only be nested one level deep')
  }

  if (selfId) {
    const [child] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.parentId, selfId)))
      .limit(1)

    if (child) {
      throw unprocessable('INVALID_PARENT', 'A category with children cannot become a child itself')
    }
  }
}

categoriesRouter.get('/', async (req, res) => {
  const userId = req.auth!.user.id
  const { view, type } = listQuerySchema.parse(req.query)

  if (view === 'options') {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        parentId: categories.parentId,
        type: categories.type,
      })
      .from(categories)
      .where(
        type
          ? and(eq(categories.userId, userId), eq(categories.type, type))
          : eq(categories.userId, userId),
      )
      .orderBy(asc(categories.name))

    res.json(parseResponse(categoryOptionListResponseSchema, rows))
    return
  }

  const rows = await db
    .select()
    .from(categories)
    .where(
      type
        ? and(eq(categories.userId, userId), eq(categories.type, type))
        : eq(categories.userId, userId),
    )
    .orderBy(asc(categories.name))

  res.json(parseResponse(categoryListResponseSchema, rows.map(categoryDto)))
})

categoriesRouter.get('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, id)))
    .limit(1)

  if (!row) throw notFound('Category')
  res.json(parseResponse(categoryDtoSchema, categoryDto(row)))
})

categoriesRouter.post('/', async (req, res) => {
  const userId = req.auth!.user.id
  const input = createCategorySchema.parse(req.body)

  const row = await db.transaction(async tx => {
    await assertParent(tx, userId, input.parentId, input.type)
    const [created] = await tx
      .insert(categories)
      .values({
        userId,
        parentId: input.parentId ?? null,
        name: input.name,
        icon: input.icon ?? null,
        color: input.color ?? null,
        type: input.type,
      })
      .returning()
    return created
  })

  res.status(201).json(parseResponse(categoryDtoSchema, categoryDto(row)))
})

categoriesRouter.patch('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)
  const input = updateCategorySchema.parse(req.body)

  const row = await db.transaction(async tx => {
    const [existing] = await tx
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.id, id)))
      .limit(1)

    if (!existing) throw notFound('Category')

    const nextType = input.type ?? existing.type
    const nextParentId = input.parentId === undefined ? existing.parentId : input.parentId

    await assertParent(tx, userId, nextParentId, nextType, id)

    if (nextType !== existing.type) {
      const [child] = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.userId, userId), eq(categories.parentId, id)))
        .limit(1)

      if (child) {
        throw unprocessable(
          'CATEGORY_HAS_CHILDREN',
          'Change the child categories before changing this category type',
        )
      }
    }

    const changes = Object.fromEntries(
      Object.entries({
        name: input.name,
        parentId: input.parentId,
        icon: input.icon,
        color: input.color,
        type: input.type,
      }).filter(([, value]) => value !== undefined),
    )

    const [updated] = await tx
      .update(categories)
      .set(changes)
      .where(and(eq(categories.userId, userId), eq(categories.id, id)))
      .returning()

    return updated
  })

  res.json(parseResponse(categoryDtoSchema, categoryDto(row)))
})

categoriesRouter.delete('/:id', async (req, res) => {
  const userId = req.auth!.user.id
  const id = z.string().uuid().parse(req.params.id)

  const [row] = await db
    .delete(categories)
    .where(and(eq(categories.userId, userId), eq(categories.id, id)))
    .returning({ id: categories.id })

  if (!row) throw notFound('Category')
  res.status(204).end()
})
