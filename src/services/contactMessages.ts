import { fetchOneOrThrow, fetchRows, getSupabaseClient, runMutation, toDatabaseRow } from './base'
import type { Patch } from './base'
import type { ContactMessage } from '@/types/entities'

/**
 * The contact inbox, from both sides: the public submit path and the admin triage path.
 *
 * This is the only write path the public has anywhere in the application, and the database
 * is what makes it safe: `contact_messages` grants INSERT to `anon` and nothing else, so
 * a visitor can submit and can neither read the inbox, nor mark a message read, nor forge
 * a timestamp. A trigger rewrites `is_read`, `is_archived`, and `created_at` before the
 * policy's `WITH CHECK` runs, so a crafted request cannot pre-triage its own message.
 *
 * Because of that, nothing in the submit path needs to check permissions — and nothing there
 * could enforce them if it tried. RLS is the enforcement point.
 *
 * The admin half below holds SELECT, UPDATE, and DELETE, which `authenticated` has on this
 * table and `anon` does not.
 */

export type ContactSubmission = {
  name: string
  email: string
  subject?: string | null
  message: string
}

export async function submitContactMessage(submission: ContactSubmission): Promise<void> {
  await runMutation(
    () =>
      getSupabaseClient().from('contact_messages').insert({
        name: submission.name,
        email: submission.email,
        subject: submission.subject ?? null,
        message: submission.message,
      }),
    'Your message could not be sent. Please try again, or email me directly.',
  )
}

/*
  The rest of this file is the admin inbox. Deliberately no create and no editing of the
  message body: a message is something a stranger wrote, and rewriting the text would make
  the inbox disagree with what was actually received. The owner triages — read, archive,
  delete — and replies over email, which is what the `mailto:` link in the detail dialog uses.
*/

export type MessageFilter = 'inbox' | 'unread' | 'archived'

/**
 * The messages the owner should see, newest first.
 *
 * Filtered in the query rather than in the browser, so the admin list never holds rows it is
 * not showing and the tab counts and the rows come from the same place.
 */
export async function getContactMessages(filter: MessageFilter): Promise<ContactMessage[]> {
  const query = getSupabaseClient()
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })

  // "Archived" is the complement of the inbox rather than a filter on it, so the two are
  // separate queries. Anything else is the live inbox, optionally narrowed to unread.
  if (filter === 'archived') {
    return fetchRows<'contact_messages'>(
      () => query.eq('is_archived', true),
      'Could not load archived messages.',
    )
  }

  if (filter === 'unread') {
    return fetchRows<'contact_messages'>(
      () => query.eq('is_archived', false).eq('is_read', false),
      'Could not load unread messages.',
    )
  }

  return fetchRows<'contact_messages'>(() => query.eq('is_archived', false), 'Could not load the inbox.')
}

/** How many messages are in each view, for the tab labels. */
export async function getMessageCounts(): Promise<Record<MessageFilter, number>> {
  const client = getSupabaseClient()
  const count = async (query: ReturnType<typeof client.from>) => {
    const { count: total } = await query.select('id', { count: 'exact', head: true })
    return total ?? 0
  }

  const [inbox, archived] = await Promise.all([
    count(client.from('contact_messages').select('id').eq('is_archived', false)),
    count(client.from('contact_messages').select('id').eq('is_archived', true)),
  ])

  // Unread is a subset of the inbox, so it is counted separately rather than derived from
  // the inbox total: a message archived before it was read leaves the two out of step.
  const unread = await count(
    client.from('contact_messages').select('id').eq('is_archived', false).eq('is_read', false),
  )

  return { inbox, unread, archived }
}

/** Sets the read and archived flags. These two columns are the only writable ones. */
export function updateContactMessage(
  id: string,
  values: Pick<Patch<'contact_messages'>, 'isRead' | 'isArchived'>,
): Promise<ContactMessage> {
  return fetchOneOrThrow<'contact_messages'>(
    () =>
      getSupabaseClient()
        .from('contact_messages')
        .update(toDatabaseRow<'contact_messages'>(values))
        .eq('id', id)
        .select()
        .limit(1),
    'Could not update the message.',
  )
}

export async function deleteContactMessage(id: string): Promise<void> {
  await runMutation(
    () => getSupabaseClient().from('contact_messages').delete().eq('id', id),
    'Could not delete the message.',
  )
}
