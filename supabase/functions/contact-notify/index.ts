/**
 * Emails the owner whenever a visitor submits the contact form.
 *
 * How it is wired, and why:
 *
 * 1. The browser inserts into `contact_messages` exactly as before. Nothing changed on the
 *    client, so no new key or endpoint was shipped to the public site.
 * 2. An AFTER INSERT trigger queues a POST here with pg_net (see the migration
 *    `20261007120000_contact_message_email_notification`), which is asynchronous and runs
 *    after the insert commits — a failed notification can never lose or block a message.
 * 3. `verify_jwt` is off because pg_net sends no user JWT, so the function authorizes the
 *    request itself: the payload must be an INSERT for `public.contact_messages`, and the
 *    only thing taken from it is the row id. The message is then read back with the secret
 *    key. A caller therefore cannot invent content — at most they can point at a row that
 *    already exists, and ids are never returned to visitors.
 */
// Pinned to the version the site uses (see package.json) so a new release cannot change
// the notification path without someone reading the diff.
import { createClient } from 'npm:@supabase/supabase-js@2.100.1'
import { sendContactNotification, type ContactMessage } from './email.ts'

type WebhookPayload = {
  type?: unknown
  schema?: unknown
  table?: unknown
  record?: { id?: unknown }
}

type AdminClient = ReturnType<typeof createClient>

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// The form only has a honeypot in front of it, and `anon` may insert freely, so a script
// could burn the whole email quota in a burst. Past this many messages in the window the
// notification is dropped — the messages themselves are still saved for the admin inbox.
const FLOOD_WINDOW_MS = 10 * 60 * 1000
const FLOOD_LIMIT = 10

Deno.serve(async (req) => {
  try {
    return await handle(req)
  } catch (error) {
    console.error('contact-notify failed unexpectedly', error)
    return respond({ error: 'Unexpected failure.' }, 500)
  }
})

async function handle(req: Request): Promise<Response> {
  if (req.method !== 'POST') return respond({ error: 'Only POST is supported.' }, 405)

  const id = contactMessageId(await readPayload(req))
  if (!id) return respond({ error: 'Unexpected payload.' }, 400)

  const admin = adminClient()
  if (!admin) return respond({ error: 'The function is missing its Supabase credentials.' }, 500)

  // Read the message instead of trusting the body, and re-check the flood guard against
  // the database rather than the payload: the database is the only input here that is
  // already validated and already access-controlled.
  const { data, error } = await admin
    .from('contact_messages')
    .select('id, name, email, subject, message, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('contact-notify: could not read the message', error.message)
    return respond({ error: 'Could not read the message.' }, 500)
  }
  if (!data) return respond({ error: 'Message not found.' }, 404)

  // No generated types on the Deno side, so the selected columns are asserted once here.
  const message = data as ContactMessage

  if (await isFlooding(admin)) {
    console.warn(`contact-notify: notification dropped for ${message.id}, the inbox is receiving too many messages to email every one.`)
    return respond({ ok: true, skipped: 'flood' }, 200)
  }

  const outcome = await sendContactNotification(message)
  if (!outcome.ok) {
    console.error(`contact-notify: ${outcome.reason}`)
    return respond({ error: 'The notification email could not be sent.' }, 502)
  }

  return respond({ ok: true }, 200)
}

/** Accepts the webhook payload only when it is an insert on the contact inbox. */
function contactMessageId(payload: WebhookPayload | null): string | null {
  if (!payload) return null
  if (payload.type !== 'INSERT') return null
  if (payload.schema !== 'public' || payload.table !== 'contact_messages') return null

  const id = payload.record?.id
  return typeof id === 'string' && UUID_PATTERN.test(id) ? id : null
}

async function readPayload(req: Request): Promise<WebhookPayload | null> {
  try {
    const parsed: unknown = await req.json()
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as WebhookPayload
  } catch {
    return null
  }
}

async function isFlooding(admin: AdminClient): Promise<boolean> {
  const since = new Date(Date.now() - FLOOD_WINDOW_MS).toISOString()
  const { count, error } = await admin
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since)

  if (error) {
    // The guard protects a quota, it does not gate the message. If it cannot be checked,
    // the notification is sent rather than quietly lost.
    console.error('contact-notify: flood check failed', error.message)
    return false
  }

  return (count ?? 0) > FLOOD_LIMIT
}

function adminClient(): AdminClient | null {
  const url = Deno.env.get('SUPABASE_URL')
  const key = secretKey()
  if (!url || !key) return null

  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * The key that may read `contact_messages`, which the public cannot.
 *
 * Supabase exposes it as a dictionary of named keys on projects using the newer API keys
 * and as a single variable on older ones. Both are accepted so that rotating the keys does
 * not silently stop the notifications.
 */
function secretKey(): string | null {
  const named = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (named) {
    try {
      const keys = JSON.parse(named) as Record<string, unknown>
      if (typeof keys.default === 'string') return keys.default
    } catch (error) {
      console.error('contact-notify: SUPABASE_SECRET_KEYS is not valid JSON', error)
    }
  }

  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? null
}

function respond(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
