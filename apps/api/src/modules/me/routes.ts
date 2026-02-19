import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/client.js'
import { profiles } from '../../db/schema.js'
import { requireAuth } from '../../auth/middleware.js'

export const meRouter = Router()

meRouter.use(requireAuth)

const updateMeSchema = z
  .object({
    fullName: z.string().trim().max(100).nullable().optional(),
    avatarUrl: z.string().url().max(2048).nullable().optional(),
    defaultCurrency: z
      .string()
      .trim()
      .length(3)
      .transform(value => value.toUpperCase())
      .optional(),
  })
  .strict()

/** Covers users created before the profile hook existed. */
async function getOrCreateProfile(user: {
  id: string
  name: string
  image?: string | null
}) {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (existing) return existing

  const [created] = await db
    .insert(profiles)
    .values({
      id: user.id,
      fullName: user.name,
      avatarUrl: user.image ?? null,
    })
    .onConflictDoNothing()
    .returning()

  if (created) return created

  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1)

  if (!row) throw new Error('Could not create profile')
  return row
}

meRouter.get('/', async (req, res) => {
  const { user } = req.auth!
  const profile = await getOrCreateProfile(user)

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
    },
    profile,
  })
})

meRouter.patch('/', async (req, res) => {
  const { user } = req.auth!
  const input = updateMeSchema.parse(req.body)
  await getOrCreateProfile(user)

  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  )

  const [profile] =
    Object.keys(changes).length === 0
      ? await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1)
      : await db
          .update(profiles)
          .set(changes)
          .where(eq(profiles.id, user.id))
          .returning()

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
    },
    profile,
  })
})
