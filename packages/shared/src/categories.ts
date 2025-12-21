import { z } from 'zod'
import {
  colorSchema,
  iconSchema,
  nameSchema,
  timestampSchema,
  txTypeSchema,
  uuidSchema,
} from './common.js'

export const categoryDtoSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  parentId: uuidSchema.nullable(),
  name: z.string(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  type: txTypeSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
})

export const categoryOptionDtoSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  parentId: uuidSchema.nullable(),
  type: txTypeSchema,
})

export const categoryListResponseSchema = z.array(categoryDtoSchema)
export const categoryOptionListResponseSchema = z.array(categoryOptionDtoSchema)

export const createCategorySchema = z
  .object({
    name: nameSchema,
    parentId: uuidSchema.nullable().optional(),
    icon: iconSchema.optional(),
    color: colorSchema.optional(),
    type: txTypeSchema,
  })
  .strict()

export const updateCategorySchema = z
  .object({
    name: nameSchema.optional(),
    parentId: uuidSchema.nullable().optional(),
    icon: iconSchema.optional(),
    color: colorSchema.optional(),
    type: txTypeSchema.optional(),
  })
  .strict()
  .refine(input => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  })

export type CategoryDto = z.infer<typeof categoryDtoSchema>
export type CategoryOptionDto = z.infer<typeof categoryOptionDtoSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
