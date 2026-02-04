import { randomUUID } from 'node:crypto'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import bcrypt from 'bcryptjs'
import { db } from '../db/client.js'
import * as schema from '../db/schema.js'
import { sendEmail } from './email.js'

const secret = process.env.BETTER_AUTH_SECRET
if (!secret) {
  throw new Error('BETTER_AUTH_SECRET is not set (see apps/api/.env.example)')
}

const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:4000'
const trustedOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

/**
 * UUID ids keep migrated users and their references stable. Bcrypt keeps legacy
 * password hashes working, and a hook creates the profile row for each user.
 */
export const auth = betterAuth({
  appName: 'Spendio',
  baseURL,
  secret,
  trustedOrigins,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  advanced: {
    database: {
      generateId: () => randomUUID(),
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    password: {
      hash: password => bcrypt.hash(password, 12),
      // Legacy bcrypt hashes still work.
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your Spendio password',
        text: `Open this link to choose a new password:\n\n${url}\n\nThe link expires in one hour.`,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Verify your Spendio email',
        text: `Open this link to verify your email:\n\n${url}`,
      })
    },
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            prompt: 'select_account',
          },
        }
      : undefined,
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        after: async createdUser => {
          await db
            .insert(schema.profiles)
            .values({
              id: createdUser.id,
              fullName: createdUser.name,
              avatarUrl: createdUser.image ?? null,
            })
            .onConflictDoNothing()
        },
      },
    },
  },
})

export type AuthSession = typeof auth.$Infer.Session
