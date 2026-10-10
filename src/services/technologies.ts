import { fetchOneOrThrow, fetchRows, getSupabaseClient, toDatabaseRow } from './base'
import type { TechnologyValues } from '@/schemas/skills'
import type { Technology } from '@/types/entities'

/**
 * The technology catalogue.
 *
 * Technologies are the filter chips on the public Projects page, and `project_technologies`
 * links projects to them. Because a project's filter is driven from this table, adding a
 * technology here makes it immediately available to every project form, and renaming one
 * changes the label a visitor sees on the filter.
 *
 * Deleting a technology removes its links from every project — `project_technologies` has
 * `on delete cascade` — but never the projects themselves.
 */

export async function createTechnology(values: TechnologyValues): Promise<Technology> {
  return fetchOneOrThrow<'technologies'>(
    () =>
      getSupabaseClient()
        .from('technologies')
        .insert(toDatabaseRow<'technologies'>(values))
        .select()
        .limit(1),
    'Could not save the technology.',
  )
}

export async function updateTechnology(id: string, values: TechnologyValues): Promise<Technology> {
  return fetchOneOrThrow<'technologies'>(
    () =>
      getSupabaseClient()
        .from('technologies')
        .update(toDatabaseRow<'technologies'>(values))
        .eq('id', id)
        .select()
        .limit(1),
    'Could not save the technology.',
  )
}

export async function deleteTechnology(id: string): Promise<void> {
  await fetchRows<'technologies'>(
    () => getSupabaseClient().from('technologies').delete().eq('id', id).select(),
    'Could not delete the technology.',
  )
}
