import { z } from 'zod'
import {
  colorSchema,
  iconSchema,
  isoDateSchema,
  nameSchema,
  positiveMoneySchema,
  timestampSchema,
  uuidSchema,
} from './common.js'

export const savingsGoalDtoSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  name: z.string(),
  targetAmount: z.string(),
  currentAmount: z.string(),
  deadline: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const savingsGoalListResponseSchema = z.array(savingsGoalDtoSchema)

export const createSavingsGoalSchema = z
  .object({
    name: nameSchema,
    targetAmount: positiveMoneySchema,
    deadline: isoDateSchema.nullable().optional(),
    icon: iconSchema.optional(),
    color: colorSchema.optional(),
  })
  .strict()

export const updateSavingsGoalSchema = z
  .object({
    name: nameSchema.optional(),
    targetAmount: positiveMoneySchema.optional(),
    deadline: isoDateSchema.nullable().optional(),
    icon: iconSchema.optional(),
    color: colorSchema.optional(),
  })
  .strict()
  .refine(input => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  })

export const contributeSavingsGoalSchema = z
  .object({
    amount: positiveMoneySchema,
  })
  .strict()

export type SavingsGoalDto = z.infer<typeof savingsGoalDtoSchema>
export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>
export type ContributeSavingsGoalInput = z.infer<typeof contributeSavingsGoalSchema>
