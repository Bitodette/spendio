import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../lib/http-error.js'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: error.issues,
      },
    })
    return
  }

  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message },
    })
    return
  }

  const pgCode = (error as { code?: string } | null)?.code
  if (pgCode === '23505') {
    res.status(409).json({
      error: { code: 'CONFLICT', message: 'That value already exists' },
    })
    return
  }
  if (pgCode === '23503') {
    res.status(409).json({
      error: { code: 'REFERENCE_CONFLICT', message: 'Referenced record does not exist' },
    })
    return
  }
  if (pgCode === '23514') {
    res.status(422).json({
      error: { code: 'CHECK_VIOLATION', message: 'Value violates a database constraint' },
    })
    return
  }

  if ((error as { type?: string } | null)?.type === 'entity.too.large') {
    res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' },
    })
    return
  }

  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' },
    })
    return
  }

  console.error(error)
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  })
}
