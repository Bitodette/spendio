import type { ZodType } from 'zod'

/** A response that breaks its schema is a server bug, so fail with 500. */
export function parseResponse<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    console.error('Response contract violation:', result.error)
    throw new Error('Response contract violation')
  }
  return result.data
}
