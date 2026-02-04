/** Console transport is local-only; production fails closed until a provider is set. */
export interface EmailMessage {
  to: string
  subject: string
  text: string
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const transport =
    process.env.EMAIL_TRANSPORT ??
    (process.env.NODE_ENV === 'production' ? 'none' : 'console')

  if (transport === 'console') {
    console.info(
      `\n--- email ---\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n-------------`,
    )
    return
  }

  throw new Error('Email transport is not configured (EMAIL_TRANSPORT is not "console")')
}
