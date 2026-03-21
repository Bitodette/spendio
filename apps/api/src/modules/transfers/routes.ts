import { Router } from 'express'
import { createTransferSchema, transferResponseSchema } from '@spendio/shared'
import { parseResponse } from '../../lib/response.js'
import { requireAuth } from '../../auth/middleware.js'
import { transferBetweenAccounts } from '../transactions/service.js'

export const transfersRouter = Router()
transfersRouter.use(requireAuth)

transfersRouter.post('/', async (req, res) => {
  const userId = req.auth!.user.id
  const input = createTransferSchema.parse(req.body)
  const transfer = await transferBetweenAccounts(userId, input)
  res.status(201).json(parseResponse(transferResponseSchema, transfer))
})
