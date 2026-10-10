import { fetchOneOrThrow, fetchRows, getSupabaseClient, toDatabaseRow } from './base'
import type { ExperienceValues } from '@/schemas/experience'
import type { Experience } from '@/types/entities'

/**
 * Employment history.
 *
 * Ordered by start date descending, so the most recent role appears first — the
 * convention every CV uses, and the one a visitor scanning the page expects.
 */
export async function getExperiences(): Promise<Experience[]> {
  return fetchRows<'experiences'>(
    () =>
      getSupabaseClient()
        .from('experiences')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('start_date', { ascending: false }),
    'Could not load the work experience.',
  )
}

/**
 * Every role, including drafts.
 *
 * The admin table needs unpublished rows, so it cannot reuse `getExperiences` — that one asks
 * the database for published rows only. Kept as a separate function under a separate query
 * key so saving a draft refreshes the admin table without also refetching the public timeline.
 */
export async function getAllExperiences(): Promise<Experience[]> {
  return fetchRows<'experiences'>(
    () =>
      getSupabaseClient()
        .from('experiences')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('start_date', { ascending: false }),
    'Could not load the work experience.',
  )
}

export function createExperience(values: ExperienceValues): Promise<Experience> {
  return fetchOneOrThrow<'experiences'>(
    () =>
      getSupabaseClient()
        .from('experiences')
        .insert(toDatabaseRow<'experiences'>(values))
        .select()
        .limit(1),
    'Could not save the role.',
  )
}

export function updateExperience(id: string, values: ExperienceValues): Promise<Experience> {
  return fetchOneOrThrow<'experiences'>(
    () =>
      getSupabaseClient()
        .from('experiences')
        .update(toDatabaseRow<'experiences'>(values))
        .eq('id', id)
        .select()
        .limit(1),
    'Could not save the role.',
  )
}

export async function deleteExperience(id: string): Promise<void> {
  await fetchRows<'experiences'>(
    () => getSupabaseClient().from('experiences').delete().eq('id', id).select(),
    'Could not delete the role.',
  )
}
