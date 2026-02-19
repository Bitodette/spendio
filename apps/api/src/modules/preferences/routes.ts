import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import {
  preferenceDtoSchema,
  preferenceKeySchema,
  setPreferenceSchema,
} from '@spendio/shared'
import { parseResponse } from '../../lib/response.js'
import { db } from '../../db/client.js'
import { userPreferences } from '../../db/schema.js'
import { requireAuth } from '../../auth/middleware.js'

export const preferencesRouter = Router()
preferencesRouter.use(requireAuth)

preferencesRouter.get('/:key', async (req, res) => {
  const userId = req.auth!.user.id
  const key = preferenceKeySchema.parse(req.params.key)

  const [row] = await db
    .select({ key: userPreferences.key, value: userPreferences.value })
    .from(userPreferences)
    .where(and(eq(userPreferences.userId, userId), eq(userPreferences.key, key)))
    .limit(1)

  res.json(parseResponse(preferenceDtoSchema, { key, value: row?.value ?? null }))
})

preferencesRouter.put('/:key', async (req, res) => {
  const userId = req.auth!.user.id
  const key = preferenceKeySchema.parse(req.params.key)
  const input = setPreferenceSchema.parse(req.body)

  await db
    .insert(userPreferences)
    .values({ userId, key, value: input.value })
    .onConflictDoUpdate({
      target: [userPreferences.userId, userPreferences.key],
      set: { value: input.value },
    })

  res.json(parseResponse(preferenceDtoSchema, { key, value: input.value }))
})
