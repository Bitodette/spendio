import { z } from 'zod'

/** Postgres `numeric(16,2)`: at most 14 digits before the decimal point. */
const RAW_MONEY = /^\d{1,14}(?:\.\d{1,2})?$/

/**
 * Returns a decimal string with exactly two fractional digits. Numbers are
 * accepted for compatibility; strings avoid binary-float rounding.
 */
export function normalizeMoney(value: string | number): string {
  const raw = typeof value === 'number' ? value.toFixed(2) : value.trim()
  const negative = raw.startsWith('-')
  const unsigned = negative ? raw.slice(1) : raw

  if (!RAW_MONEY.test(unsigned)) {
    throw new Error('Enter a valid amount with at most 2 decimal places')
  }

  const [whole, fraction = ''] = unsigned.split('.')
  return `${negative ? '-' : ''}${whole}.${fraction.padEnd(2, '0')}`
}

/** Exact cents for comparisons and display maths that must not drift. */
export function moneyToCents(value: string): bigint {
  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  const [whole, fraction = ''] = unsigned.split('.')
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2))
  return negative ? -cents : cents
}

export function centsToMoney(cents: bigint): string {
  const negative = cents < 0n
  const absolute = negative ? -cents : cents
  return `${negative ? '-' : ''}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, '0')}`
}

export function addMoney(left: string, right: string): string {
  return centsToMoney(moneyToCents(left) + moneyToCents(right))
}

const moneyInputSchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    if (typeof value === 'string' && value.trim() === '') {
      ctx.addIssue({ code: 'custom', message: 'Enter an amount' })
      return z.NEVER
    }

    try {
      return normalizeMoney(value)
    } catch (error) {
      ctx.addIssue({
        code: 'custom',
        message: error instanceof Error ? error.message : 'Enter a valid amount',
      })
      return z.NEVER
    }
  })

export const moneySchema = moneyInputSchema

export const positiveMoneySchema = moneyInputSchema.refine(
  value => moneyToCents(value) > 0n,
  { message: 'Enter an amount greater than zero' },
)

export const nonNegativeMoneySchema = moneyInputSchema.refine(
  value => moneyToCents(value) >= 0n,
  { message: 'Amount must not be negative' },
)

export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a yyyy-MM-dd date')
  .refine(isValidIsoDate, 'Invalid calendar date')

export const uuidSchema = z.string().uuid()

export const txTypeSchema = z.enum(['income', 'expense'])
export const accountTypeSchema = z.enum(['bank', 'e-wallet', 'cash'])
export const frequencySchema = z.enum(['weekly', 'monthly', 'yearly'])
export const budgetPeriodSchema = z.enum(['monthly', 'yearly'])

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or fewer')
export const optionalTextSchema = z.string().trim().max(500).nullable()
export const colorSchema = z.string().trim().max(32).nullable()
export const iconSchema = z.string().trim().max(64).nullable()

export const timestampSchema = z.string()

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})

export const cursorPaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().max(512).optional(),
})

export type TxType = z.infer<typeof txTypeSchema>
export type AccountType = z.infer<typeof accountTypeSchema>
export type Frequency = z.infer<typeof frequencySchema>
export type BudgetPeriod = z.infer<typeof budgetPeriodSchema>
export type Money = z.infer<typeof moneySchema>
