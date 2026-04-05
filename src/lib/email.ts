import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')

const EMAIL_FROM = process.env.EMAIL_FROM || 'Altamoda <onboarding@resend.dev>'
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  })

  if (result.error) {
    console.error('Email send failed:', result.error)
    throw new Error(result.error.message)
  }

  return result.data
}

export async function sendBatchEmails(emails: { to: string; subject: string; html: string }[]) {
  // Resend batch API supports up to 100 emails per call
  const batches: typeof emails[] = []
  for (let i = 0; i < emails.length; i += 100) {
    batches.push(emails.slice(i, i + 100))
  }

  const results = []
  for (const batch of batches) {
    const result = await resend.batch.send(
      batch.map((email) => ({
        from: EMAIL_FROM,
        to: email.to,
        subject: email.subject,
        html: email.html,
      }))
    )
    if (result.error) {
      console.error('Batch email send failed:', result.error)
      throw new Error(result.error.message)
    }
    results.push(result.data)
  }

  return results
}

export function getUnsubscribeUrl(email: string) {
  const token = Buffer.from(email).toString('base64url')
  return `${SITE_URL}/newsletter/unsubscribe?token=${token}`
}

export { SITE_URL, EMAIL_FROM }
