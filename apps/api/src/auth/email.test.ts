import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendEmail, validateEmailTransport } from './email.js'

const message = { to: 'user@example.com', subject: 'Hi', text: 'Body' }

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('email transport', () => {
  it('prints to the console outside production by default', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('EMAIL_TRANSPORT', '')
    const logged = vi.spyOn(console, 'info').mockImplementation(() => {})

    await sendEmail(message)

    expect(logged).toHaveBeenCalledOnce()
    expect(String(logged.mock.calls[0]?.[0])).toContain('user@example.com')
  })

  it('fails closed in production when email is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('EMAIL_TRANSPORT', '')
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(() => validateEmailTransport()).not.toThrow()
    await expect(sendEmail(message)).rejects.toThrow('Email transport is disabled')
  })

  it('requires RESEND_API_KEY for the resend transport', () => {
    vi.stubEnv('EMAIL_TRANSPORT', 'resend')
    vi.stubEnv('EMAIL_FROM', 'Spendio <no-reply@example.com>')
    vi.stubEnv('RESEND_API_KEY', '')

    expect(() => validateEmailTransport()).toThrow('RESEND_API_KEY is not set')
  })

  it('requires SMTP_HOST for the smtp transport', () => {
    vi.stubEnv('EMAIL_TRANSPORT', 'smtp')
    vi.stubEnv('EMAIL_FROM', 'Spendio <no-reply@example.com>')
    vi.stubEnv('SMTP_HOST', '')

    expect(() => validateEmailTransport()).toThrow('SMTP_HOST is not set')
  })

  it('rejects unknown transports', () => {
    vi.stubEnv('EMAIL_TRANSPORT', 'carrier-pigeon')

    expect(() => validateEmailTransport()).toThrow('Unknown EMAIL_TRANSPORT')
  })
})
