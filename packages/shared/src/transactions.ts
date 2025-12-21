import { z } from 'zod'
import {
  cursorPaginationSchema,
  isoDateSchema,
  moneySchema,
  positiveMoneySchema,
  timestampSchema,
  txTypeSchema,
  uuidSchema,
} from './common.js'

export const dateRangeSchema = z.enum(['today', 'week', 'month', 'all'])

export const transactionDtoSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  accountId: uuidSchema,
  categoryId: uuidSchema.nullable(),
  type: txTypeSchema,
  amount: z.string(),
  description: z.string().nullable(),
  date: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  category: z.object({ name: z.string() }).nullable(),
  account: z.object({ name: z.string() }).nullable(),
})

export const transactionSummarySchema = z.object({
  income: moneySchema,
  expense: moneySchema,
  net: moneySchema,
})

export const transactionListResponseSchema = z.object({
  items: z.array(transactionDtoSchema),
  nextCursor: z.string().nullable(),
  summary: transactionSummarySchema,
})

export const transactionFiltersSchema = cursorPaginationSchema.extend({
  range: dateRangeSchema.default('month'),
  search: z.string().trim().max(200).default(''),
  accountId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
})

export const createTransactionSchema = z
  .object({
    accountId: uuidSchema,
    categoryId: uuidSchema.nullable().optional(),
    type: txTypeSchema,
    amount: positiveMoneySchema,
    description: z.string().trim().max(500).nullable().optional(),
    date: isoDateSchema,
  })
  .strict()

export const updateTransactionSchema = z
  .object({
    accountId: uuidSchema.optional(),
    categoryId: uuidSchema.nullable().optional(),
    type: txTypeSchema.optional(),
    amount: positiveMoneySchema.optional(),
    description: z.string().trim().max(500).nullable().optional(),
    date: isoDateSchema.optional(),
  })
  .strict()
  .refine(input => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  })

export const transactionCursorSchema = z.object({
  date: isoDateSchema,
  createdAt: z.string(),
  id: uuidSchema,
})

export type DateRange = z.infer<typeof dateRangeSchema>
export type TransactionDto = z.infer<typeof transactionDtoSchema>
export type TransactionSummary = z.infer<typeof transactionSummarySchema>
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionCursor = z.infer<typeof transactionCursorSchema>
