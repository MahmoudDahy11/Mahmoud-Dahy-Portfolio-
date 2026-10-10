/**
 * Builds and sends the notification email for one contact message.
 *
 * This runs inside the `contact-notify` Edge Function, so the Resend API key never leaves
 * Supabase's servers — it is read from the function's environment here and nowhere else.
 *
 * The message itself comes from the database rather than from the webhook body (see
 * `index.ts`), which is why it can be treated as stored data. It is still HTML-escaped:
 * the body is a stranger's text, and an email client renders markup whoever wrote it.
 */

export type ContactMessage = {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  created_at: string
}

export type SendOutcome = { ok: true } | { ok: false; reason: string }

const RESEND_SEND_ENDPOINT = 'https://api.resend.com/emails'

/** The form caps the stored subject at 160 characters; this covers anything that does not. */
const SUBJECT_LIMIT = 200

export async function sendContactNotification(message: ContactMessage): Promise<SendOutcome> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const to = Deno.env.get('CONTACT_NOTIFY_EMAIL')
  // Resend only delivers from a verified sender. Until a domain is added in the Resend
  // dashboard this falls back to their test sender, which reaches the address on the
  // Resend account itself — enough to get the first notification working.
  const from = Deno.env.get('CONTACT_FROM_EMAIL') ?? 'Portfolio Contact <onboarding@resend.dev>'

  if (!apiKey || !to) {
    return {
      ok: false,
      reason: 'RESEND_API_KEY and CONTACT_NOTIFY_EMAIL must be set for this function.',
    }
  }

  const response = await fetch(RESEND_SEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      // So answering the notification answers the visitor, not the notification.
      reply_to: message.email,
      subject: subjectOf(message),
      text: textBody(message),
      html: htmlBody(message),
    }),
  })

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500)
    return { ok: false, reason: `Resend returned ${response.status}: ${detail}` }
  }

  return { ok: true }
}

function subjectOf(message: ContactMessage): string {
  const topic = message.subject?.trim()
  const subject = topic
    ? `New contact message: ${topic}`
    : `New contact message from ${message.name}`
  return subject.slice(0, SUBJECT_LIMIT)
}

function textBody(message: ContactMessage): string {
  return [
    'New contact message',
    '',
    `From: ${message.name} <${message.email}>`,
    `Received: ${formatReceivedAt(message.created_at)}`,
    `Subject: ${message.subject?.trim() || '(none)'}`,
    '',
    'Message:',
    '',
    message.message,
    '',
    `Reply to this email to answer ${message.name} directly.`,
  ].join('\n')
}

function htmlBody(message: ContactMessage): string {
  const name = escapeHtml(message.name)
  const email = escapeHtml(message.email)
  const subject = escapeHtml(message.subject?.trim() || '(none)')
  const received = escapeHtml(formatReceivedAt(message.created_at))
  const body = escapeHtml(message.message)

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;border-collapse:collapse;">
      <tr>
        <td style="padding:24px 24px 0 24px;">
          <h1 style="margin:0 0 16px;font-size:18px;">New contact message</h1>
          <p style="margin:0 0 6px;font-size:14px;color:#52525b;"><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p style="margin:0 0 6px;font-size:14px;color:#52525b;"><strong>Received:</strong> ${received}</p>
          <p style="margin:0;font-size:14px;color:#52525b;"><strong>Subject:</strong> ${subject}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px 24px 24px;">
          <div style="white-space:pre-wrap;font-size:15px;line-height:1.6;border-left:3px solid #e4e4e7;padding-left:16px;">${body}</div>
        </td>
      </tr>
    </table>
    <p style="max-width:640px;margin:12px auto 0;font-size:12px;color:#71717a;">Reply to this email to answer the sender directly.</p>
  </body>
</html>`
}

/**
 * Submission time in the email's own words. Edge Functions run in UTC, so the timestamp is
 * labelled UTC rather than passed off as the reader's local time.
 */
function formatReceivedAt(iso: string): string {
  const received = new Date(iso)
  if (Number.isNaN(received.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'UTC',
  }).format(received)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
