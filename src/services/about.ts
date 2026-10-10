import { fetchOneOrThrow, fetchRows, getSupabaseClient, toDatabaseRow } from './base'
import type { AboutSectionValues } from '@/schemas/about'
import type { AboutSection } from '@/types/entities'

/**
 * The editable blocks that make up the About page.
 *
 * `is_published` is filtered here rather than in the browser: the public site should only
 * ever receive rows the owner has published, so a draft cannot leak into the page even if
 * a future query were miswritten. Row Level Security enforces the same rule, so this is
 * a second layer rather than the only one.
 */
export async function getAboutSections(): Promise<AboutSection[]> {
  return fetchRows<'about_sections'>(
    () =>
      getSupabaseClient()
        .from('about_sections')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    'Could not load the about content.',
  )
}

/** Used by the admin dashboard, which needs drafts as well as published rows. */
export async function getAllAboutSections(): Promise<AboutSection[]> {
  return fetchRows<'about_sections'>(
    () =>
      getSupabaseClient()
        .from('about_sections')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    'Could not load the about sections.',
  )
}

export function createAboutSection(values: AboutSectionValues): Promise<AboutSection> {
  return fetchOneOrThrow<'about_sections'>(
    () =>
      getSupabaseClient()
        .from('about_sections')
        .insert(toDatabaseRow<'about_sections'>(values))
        .select()
        .limit(1),
    'Could not save the about section.',
  )
}

export function updateAboutSection(id: string, values: AboutSectionValues): Promise<AboutSection> {
  return fetchOneOrThrow<'about_sections'>(
    () =>
      getSupabaseClient()
        .from('about_sections')
        .update(toDatabaseRow<'about_sections'>(values))
        .eq('id', id)
        .select()
        .limit(1),
    'Could not save the about section.',
  )
}

export async function deleteAboutSection(id: string): Promise<void> {
  await fetchRows<'about_sections'>(
    () => getSupabaseClient().from('about_sections').delete().eq('id', id).select(),
    'Could not delete the about section.',
  )
}
