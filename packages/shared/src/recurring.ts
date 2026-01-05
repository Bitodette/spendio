import { z } from 'zod'
import {
  frequencySchema,
  isoDateSchema,
  positiveMoneySchema,
  timestampSchema,
  txTypeSchema,
  uuidSchema,
} from './common.js'
import { transactionDtoSchema } from './transactions.js'

export const recurringDtoSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  accountId: uuidSchema,
  categoryId: uuidSchema.nullable(),
  type: txTypeSchema,
  amount: z.string(),
  description: z.string().nullable(),
  frequency: frequencySchema,
  nextDate: z.string(),
  isActive: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const recurringListResponseSchema = z.array(recurringDtoSchema)

export const createRecurringSchema = z
  .object({
    accountId: uuidSchema,
    categoryId: uuidSchema.nullable().optional(),
    type: txTypeSchema,
    amount: positiveMoneySchema,
    description: z.string().trim().max(500).nullable().optional(),
    frequency: frequencySchema,
    nextDate: isoDateSchema,
  })
  .strict()

export const updateRecurringSchema = z
  .object({
    accountId: uuidSchema.optional(),
    categoryId: uuidSchema.nullable().optional(),
    type: txTypeSchema.optional(),
    amount: positiveMoneySchema.optional(),
    description: z.string().trim().max(500).nullable().optional(),
    frequency: frequencySchema.optional(),
    nextDate: isoDateSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine(input => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  })

export const postRecurringResponseSchema = z.object({
  recurring: recurringDtoSchema,
  transaction: transactionDtoSchema,
})

export type RecurringDto = z.infer<typeof recurringDtoSchema>
export type CreateRecurringInput = z.infer<typeof createRecurringSchema>
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>
export type PostRecurringResponse = z.infer<typeof postRecurringResponseSchema>
