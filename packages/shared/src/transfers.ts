import { z } from 'zod'
import { nonNegativeMoneySchema, positiveMoneySchema, uuidSchema } from './common.js'
import { transactionDtoSchema } from './transactions.js'

export const createTransferSchema = z
  .object({
    fromId: uuidSchema,
    toId: uuidSchema,
    amount: positiveMoneySchema,
    fee: nonNegativeMoneySchema.default('0.00'),
    description: z.string().trim().max(200).default(''),
  })
  .strict()
  .refine(input => input.fromId !== input.toId, {
    message: 'Source and destination accounts must differ',
  })

export const transferResponseSchema = z.object({
  from: transactionDtoSchema,
  to: transactionDtoSchema,
})

export type CreateTransferInput = z.infer<typeof createTransferSchema>
export type TransferResponse = z.infer<typeof transferResponseSchema>
