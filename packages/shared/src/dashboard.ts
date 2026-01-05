import { z } from 'zod'
import { accountTypeSchema, isoDateSchema, txTypeSchema, uuidSchema } from './common.js'

const dashboardAccountSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  type: accountTypeSchema,
  balance: z.string(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  sortOrder: z.number().int(),
})

const dashboardRecentSchema = z.object({
  id: uuidSchema,
  amount: z.string(),
  type: txTypeSchema,
  description: z.string().nullable(),
  date: z.string(),
  categoryId: uuidSchema.nullable(),
  account: z
    .object({
      name: z.string(),
      icon: z.string().nullable(),
      color: z.string().nullable(),
    })
    .nullable(),
})

const dashboardTxnAmountSchema = z.object({
  amount: z.string(),
  type: txTypeSchema,
  date: z.string(),
  categoryId: uuidSchema.nullable(),
})

const dashboardCategorySchema = z.object({
  id: uuidSchema,
  name: z.string(),
  color: z.string().nullable(),
  parentId: uuidSchema.nullable(),
  type: txTypeSchema,
})

export const dashboardResponseSchema = z.object({
  accounts: z.array(dashboardAccountSchema),
  recent: z.array(dashboardRecentSchema),
  allMonthly: z.array(dashboardTxnAmountSchema),
  categories: z.array(dashboardCategorySchema),
})

export const dashboardQuerySchema = z.object({
  now: isoDateSchema.optional(),
})

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>
