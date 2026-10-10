import { fetchOneOrThrow, fetchRows, getSupabaseClient, toDatabaseRow } from './base'
import type { EducationValues } from '@/schemas/education'
import type { Education } from '@/types/entities'

/** Academic history, most recent qualification first. */
export async function getEducations(): Promise<Education[]> {
  return fetchRows<'educations'>(
    () =>
      getSupabaseClient()
        .from('educations')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('start_date', { ascending: false }),
    'Could not load the education history.',
  )
}

/** Every entry, including drafts, for the admin table. */
export async function getAllEducations(): Promise<Education[]> {
  return fetchRows<'educations'>(
    () =>
      getSupabaseClient()
        .from('educations')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('start_date', { ascending: false }),
    'Could not load the education history.',
  )
}

export function createEducation(values: EducationValues): Promise<Education> {
  return fetchOneOrThrow<'educations'>(
    () =>
      getSupabaseClient()
        .from('educations')
        .insert(toDatabaseRow<'educations'>(values))
        .select()
        .limit(1),
    'Could not save the entry.',
  )
}

export function updateEducation(id: string, values: EducationValues): Promise<Education> {
  return fetchOneOrThrow<'educations'>(
    () =>
      getSupabaseClient()
        .from('educations')
        .update(toDatabaseRow<'educations'>(values))
        .eq('id', id)
        .select()
        .limit(1),
    'Could not save the entry.',
  )
}

export async function deleteEducation(id: string): Promise<void> {
  await fetchRows<'educations'>(
    () => getSupabaseClient().from('educations').delete().eq('id', id).select(),
    'Could not delete the entry.',
  )
}
