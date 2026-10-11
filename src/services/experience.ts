import { fetchOneOrThrow, fetchRows, getSupabaseClient, toDatabaseRow } from './base'
import { toFieldOption } from '@/utils/toFieldOption'
import type { ExperienceValues } from '@/schemas/experience'
import type { Experience } from '@/types/entities'
import type { Row } from '@/types/entities'

/**
 * Employment history.
 *
 * Ordered by start date descending, so the most recent role appears first — the
 * convention every CV uses, and the one a visitor scanning the page expects.
 */
export async function getExperiences(): Promise<Experience[]> {
  const rows = await fetchRows<'experiences'>(
    () =>
      getSupabaseClient()
        .from('experiences')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('start_date', { ascending: false }),
    'Could not load the work experience.',
  )
  return rows.map(toExperience)
}

/**
 * Every role, including drafts.
 *
 * The admin table needs unpublished rows, so it cannot reuse `getExperiences` — that one asks
 * the database for published rows only. Kept as a separate function under a separate query
 * key so saving a draft refreshes the admin table without also refetching the public timeline.
 */
export async function getAllExperiences(): Promise<Experience[]> {
  const rows = await fetchRows<'experiences'>(
    () =>
      getSupabaseClient()
        .from('experiences')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('start_date', { ascending: false }),
    'Could not load the work experience.',
  )
  return rows.map(toExperience)
}

export async function createExperience(values: ExperienceValues): Promise<Experience> {
  const row = await fetchOneOrThrow<'experiences'>(
    () =>
      getSupabaseClient()
        .from('experiences')
        .insert(toDatabaseRow<'experiences'>(values))
        .select()
        .limit(1),
    'Could not save the role.',
  )
  return toExperience(row)
}

export async function updateExperience(id: string, values: ExperienceValues): Promise<Experience> {
  const row = await fetchOneOrThrow<'experiences'>(
    () =>
      getSupabaseClient()
        .from('experiences')
        .update(toDatabaseRow<'experiences'>(values))
        .eq('id', id)
        .select()
        .limit(1),
    'Could not save the role.',
  )
  return toExperience(row)
}

function toExperience(row: Row<'experiences'>): Experience {
  return { ...row, field: toFieldOption(row.field) }
}

export async function deleteExperience(id: string): Promise<void> {
  await fetchRows<'experiences'>(
    () => getSupabaseClient().from('experiences').delete().eq('id', id).select(),
    'Could not delete the role.',
  )
}
