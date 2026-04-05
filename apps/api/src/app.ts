import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth/auth.js'
import { meRouter } from './modules/me/routes.js'
import { accountsRouter } from './modules/accounts/routes.js'
import { categoriesRouter } from './modules/categories/routes.js'
import { preferencesRouter } from './modules/preferences/routes.js'
import { transactionsRouter } from './modules/transactions/routes.js'
import { transfersRouter } from './modules/transfers/routes.js'
import { dashboardRouter } from './modules/dashboard/routes.js'
import { budgetsRouter } from './modules/budgets/routes.js'
import { recurringRouter } from './modules/recurring/routes.js'
import { savingsRouter } from './modules/savings/routes.js'
import { errorHandler } from './middleware/error-handler.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  // TLS ends at the reverse proxy; trust its forwarded headers.
  app.set('trust proxy', 1)

  const webOrigins = (process.env.WEB_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  app.use(cors({ origin: webOrigins, credentials: true }))

  // Better Auth needs the raw body, so mount it before express.json().
  app.all('/api/auth/*splat', toNodeHandler(auth))

  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/v1/me', meRouter)
  app.use('/api/v1/accounts', accountsRouter)
  app.use('/api/v1/categories', categoriesRouter)
  app.use('/api/v1/preferences', preferencesRouter)
  app.use('/api/v1/transactions', transactionsRouter)
  app.use('/api/v1/transfers', transfersRouter)
  app.use('/api/v1/dashboard', dashboardRouter)
  app.use('/api/v1/budgets', budgetsRouter)
  app.use('/api/v1/recurring', recurringRouter)
  app.use('/api/v1/savings-goals', savingsRouter)

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Not found' },
    })
  })

  app.use(errorHandler)

  return app
}
