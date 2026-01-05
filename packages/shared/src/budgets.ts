import { z } from 'zod'
import {
  budgetPeriodSchema,
  isoDateSchema,
  positiveMoneySchema,
  timestampSchema,
  uuidSchema,
} from './common.js'

export const budgetDtoSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  categoryId: uuidSchema,
  amount: z.string(),
  period: budgetPeriodSchema,
  startDate: z.string(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  category: z
    .object({
      id: uuidSchema,
      name: z.string(),
      color: z.string().nullable(),
      type: z.string(),
    })
    .nullable(),
})

export const budgetWithSpentDtoSchema = budgetDtoSchema.extend({
  spent: z.string(),
  remaining: z.string(),
  percentage: z.number(),
})

export const budgetListResponseSchema = z.array(budgetWithSpentDtoSchema)

export const budgetQuerySchema = z.object({
  period: budgetPeriodSchema.default('monthly'),
  monthOffset: z.coerce.number().int().min(0).max(24).default(0),
})

export const createBudgetSchema = z
  .object({
    categoryId: uuidSchema,
    amount: positiveMoneySchema,
    period: budgetPeriodSchema,
    startDate: isoDateSchema,
  })
  .strict()

export const updateBudgetSchema = z
  .object({
    categoryId: uuidSchema.optional(),
    amount: positiveMoneySchema.optional(),
    period: budgetPeriodSchema.optional(),
    startDate: isoDateSchema.optional(),
  })
  .strict()
  .refine(input => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  })

export type BudgetDto = z.infer<typeof budgetDtoSchema>
export type BudgetWithSpentDto = z.infer<typeof budgetWithSpentDtoSchema>
export type BudgetQuery = z.infer<typeof budgetQuerySchema>
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
