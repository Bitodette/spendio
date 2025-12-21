import { z } from 'zod'
import {
  accountTypeSchema,
  colorSchema,
  iconSchema,
  moneySchema,
  nameSchema,
  timestampSchema,
  uuidSchema,
} from './common.js'

export const accountDtoSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  name: z.string(),
  type: accountTypeSchema,
  balance: z.string(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const accountOptionDtoSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  type: accountTypeSchema,
})

export const accountListResponseSchema = z.array(accountDtoSchema)
export const accountOptionListResponseSchema = z.array(accountOptionDtoSchema)

export const createAccountSchema = z
  .object({
    name: nameSchema,
    type: accountTypeSchema,
    balance: moneySchema.default('0.00'),
    icon: iconSchema.optional(),
    color: colorSchema.optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .strict()

export const updateAccountSchema = z
  .object({
    name: nameSchema.optional(),
    type: accountTypeSchema.optional(),
    balance: moneySchema.optional(),
    icon: iconSchema.optional(),
    color: colorSchema.optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .strict()
  .refine(input => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  })

export const reorderAccountsSchema = z
  .object({
    ids: z.array(uuidSchema).min(1).max(200),
  })
  .strict()
  .refine(input => new Set(input.ids).size === input.ids.length, {
    message: 'Account ids must be unique',
  })

export type AccountDto = z.infer<typeof accountDtoSchema>
export type AccountOptionDto = z.infer<typeof accountOptionDtoSchema>
export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type ReorderAccountsInput = z.infer<typeof reorderAccountsSchema>
