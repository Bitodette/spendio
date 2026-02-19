import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth/auth.js'
import { meRouter } from './modules/me/routes.js'
import { preferencesRouter } from './modules/preferences/routes.js'
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
  app.use('/api/v1/preferences', preferencesRouter)

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Not found' },
    })
  })

  app.use(errorHandler)

  return app
}
