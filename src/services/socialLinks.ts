import { fetchOneOrThrow, fetchRows, getSupabaseClient, toDatabaseRow } from './base'
import type { SocialLinkValues } from '@/schemas/socialLink'
import type { SocialLink } from '@/types/entities'

/** Social and professional links, shown in the header, hero, and footer. */
export async function getSocialLinks(): Promise<SocialLink[]> {
  return fetchRows<'social_links'>(
    () =>
      getSupabaseClient()
        .from('social_links')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('label', { ascending: true }),
    'Could not load the social links.',
  )
}

/** Every link, including drafts, for the admin table. */
export async function getAllSocialLinks(): Promise<SocialLink[]> {
  return fetchRows<'social_links'>(
    () =>
      getSupabaseClient()
        .from('social_links')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('label', { ascending: true }),
    'Could not load the social links.',
  )
}

export function createSocialLink(values: SocialLinkValues): Promise<SocialLink> {
  return fetchOneOrThrow<'social_links'>(
    () =>
      getSupabaseClient()
        .from('social_links')
        .insert(toDatabaseRow<'social_links'>(values))
        .select()
        .limit(1),
    'Could not save the link.',
  )
}

export function updateSocialLink(id: string, values: SocialLinkValues): Promise<SocialLink> {
  return fetchOneOrThrow<'social_links'>(
    () =>
      getSupabaseClient()
        .from('social_links')
        .update(toDatabaseRow<'social_links'>(values))
        .eq('id', id)
        .select()
        .limit(1),
    'Could not save the link.',
  )
}

export async function deleteSocialLink(id: string): Promise<void> {
  await fetchRows<'social_links'>(
    () => getSupabaseClient().from('social_links').delete().eq('id', id).select(),
    'Could not delete the link.',
  )
}
