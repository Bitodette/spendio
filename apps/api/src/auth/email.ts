/**
 * Email delivery. Console output is for local development only; production
 * uses either Resend (`EMAIL_TRANSPORT=resend`) or SMTP (`EMAIL_TRANSPORT=smtp`).
 */

export interface EmailMessage {
  to: string
  subject: string
  text: string
}

export type EmailTransport = 'console' | 'none' | 'resend' | 'smtp'

const VALID_TRANSPORTS: readonly EmailTransport[] = ['console', 'none', 'resend', 'smtp']

function resolveTransport(): EmailTransport {
  const configured = process.env.EMAIL_TRANSPORT
  if (configured) {
    if (!VALID_TRANSPORTS.includes(configured as EmailTransport)) {
      throw new Error(
        `Unknown EMAIL_TRANSPORT "${configured}" (expected one of: ${VALID_TRANSPORTS.join(', ')})`,
      )
    }
    return configured as EmailTransport
  }

  return process.env.NODE_ENV === 'production' ? 'none' : 'console'
}

function emailFrom(): string {
  const from = process.env.EMAIL_FROM
  if (!from) {
    throw new Error('EMAIL_FROM is not set (e.g. "Spendio <no-reply@example.com>")')
  }
  return from
}

async function sendWithResend(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set (required when EMAIL_TRANSPORT=resend)')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: message.to,
      subject: message.subject,
      text: message.text,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend rejected the email (${response.status}): ${body}`)
  }
}

async function sendWithSmtp(message: EmailMessage): Promise<void> {
  const host = process.env.SMTP_HOST
  if (!host) {
    throw new Error('SMTP_HOST is not set (required when EMAIL_TRANSPORT=smtp)')
  }

  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const { default: nodemailer } = await import('nodemailer')

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  })

  await transport.sendMail({
    from: emailFrom(),
    to: message.to,
    subject: message.subject,
    text: message.text,
  })
}

/**
 * Fails fast at startup when a chosen transport is missing configuration.
 * `none` is allowed but disabled: sends will throw instead of being dropped.
 */
export function validateEmailTransport(): void {
  const transport = resolveTransport()

  switch (transport) {
    case 'console':
      if (process.env.NODE_ENV === 'production') {
        console.warn('[email] EMAIL_TRANSPORT=console in production; emails are not delivered')
      }
      return
    case 'none':
      console.warn('[email] Email delivery is disabled; sign-up verification and password resets will fail')
      return
    case 'resend':
      emailFrom()
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not set (required when EMAIL_TRANSPORT=resend)')
      }
      return
    case 'smtp':
      emailFrom()
      if (!process.env.SMTP_HOST) {
        throw new Error('SMTP_HOST is not set (required when EMAIL_TRANSPORT=smtp)')
      }
      return
  }
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const transport = resolveTransport()

  switch (transport) {
    case 'console':
      console.info(
        `\n--- email ---\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n-------------`,
      )
      return
    case 'none':
      throw new Error('Email transport is disabled (EMAIL_TRANSPORT=none)')
    case 'resend':
      await sendWithResend(message)
      return
    case 'smtp':
      await sendWithSmtp(message)
      return
  }
}
