import { fetchRows, getSupabaseClient, runMutation, toDatabaseRow } from './base'
import type { ContactMessage } from '@/types/entities'
import { getMessageCounts } from './contactMessages'

/**
 * The admin dashboard's numbers.
 *
 * A separate service because it is the one read that spans every content table rather than
 * belonging to any of them.
 *
 * Every figure is a `count` query with `head: true`, which asks Postgres for the number of
 * matching rows and returns no row data. That matters here more than anywhere else in the
 * app: the alternative — selecting every row of every table to count them in the browser —
 * would transfer the whole database to render a page of ten numbers, and would get slower as
 * the portfolio grew. A `limit(1)` is not a substitute, because PostgREST applies it after
 * filtering and would still scan the table.
 *
 * Drafts are counted alongside published rows because the most useful thing this page can
 * say is which sections are half-finished.
 */

/** Row counts split by publication state, for the sections that have a publish flag. */
export type ContentCounts = {
  total: number
  published: number
  drafts: number
}

export type AdminOverview = {
  counts: {
    projects: ContentCounts
    skills: ContentCounts
    experiences: ContentCounts
    education: ContentCounts
    certificates: ContentCounts
    services: ContentCounts
    socialLinks: ContentCounts
    aboutSections: ContentCounts
  }
  /** Row totals for the tables that have no publication state. */
  totals: {
    technologies: number
    skillCategories: number
    media: number
  }
  messages: {
    inbox: number
    unread: number
    archived: number
  }
  recent: ContactMessage[]
}

/**
 * The tables this page counts, named as literals.
 *
 * Supabase's generated client types `.from()` against a union of real table names, so a
 * helper taking a plain `string` cannot call it. Restricting the parameter to this union is
 * what lets `countPublishable` and `countRows` be generic over which table they read while
 * still type-checking, and it means adding a table to the dashboard is a deliberate edit
 * here rather than an untyped string.
 */
type PublishableTable =
  | 'projects'
  | 'skills'
  | 'experiences'
  | 'educations'
  | 'certificates'
  | 'services'
  | 'social_links'
  | 'about_sections'

type PlainTable = 'technologies' | 'skill_categories' | 'media'

/**
 * Counts all rows and the published subset, deriving drafts by subtraction.
 *
 * Two queries rather than three: `total - published` is exact, and eight tables at two
 * requests each is already sixteen round trips on every dashboard load.
 */
async function countPublishable(table: PublishableTable): Promise<ContentCounts> {
  const client = getSupabaseClient()

  const [all, published] = await Promise.all([
    client.from(table).select('id', { count: 'exact', head: true }),
    client.from(table).select('id', { count: 'exact', head: true }).eq('is_published', true),
  ])

  const total = all.count ?? 0
  const publishedCount = published.count ?? 0

  return { total, published: publishedCount, drafts: total - publishedCount }
}

/** A plain row count, for tables with no publication state. */
async function countRows(table: PlainTable): Promise<number> {
  const { count } = await getSupabaseClient().from(table).select('id', { count: 'exact', head: true })

  return count ?? 0
}

/**
 * The newest few inbox messages, for the dashboard's list.
 *
 * A limited query rather than a slice of the whole inbox: the counts are cheap but the rows
 * are not, and this page needs five of them.
 */
async function getRecentMessages(limit: number): Promise<ContactMessage[]> {
  return fetchRows<'contact_messages'>(
    () =>
      getSupabaseClient()
        .from('contact_messages')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(limit),
    'Could not load recent messages.',
  )
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [
    projects,
    skills,
    experiences,
    education,
    certificates,
    services,
    socialLinks,
    aboutSections,
    technologies,
    skillCategories,
    mediaFiles,
    messages,
    recent,
  ] = await Promise.all([
    countPublishable('projects'),
    countPublishable('skills'),
    countPublishable('experiences'),
    countPublishable('educations'),
    countPublishable('certificates'),
    countPublishable('services'),
    countPublishable('social_links'),
    countPublishable('about_sections'),
    countRows('technologies'),
    countRows('skill_categories'),
    countRows('media'),
    getMessageCounts(),
    getRecentMessages(5),
  ])

  return {
    counts: {
      projects,
      skills,
      experiences,
      education,
      certificates,
      services,
      socialLinks,
      aboutSections,
    },
    totals: { technologies, skillCategories, media: mediaFiles },
    messages,
    recent,
  }
}

/**
 * Marks one message read, so opening the dashboard and clicking a message does not leave
 * it still unread in the inbox.
 */
export async function markMessageRead(id: string): Promise<void> {
  await runMutation(
    () =>
      getSupabaseClient()
        .from('contact_messages')
        .update(toDatabaseRow<'contact_messages'>({ isRead: true }))
        .eq('id', id),
    'Could not update the message.',
  )
}
