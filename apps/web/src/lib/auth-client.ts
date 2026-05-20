import { createAuthClient } from 'better-auth/react'

/**
 * Points Better Auth at the Express API. `NEXT_PUBLIC_API_URL` is required
 * whenever the API is on a different origin, including local development.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || undefined,
})
