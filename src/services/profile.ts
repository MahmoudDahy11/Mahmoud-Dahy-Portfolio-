import { fetchFirst, fetchOneOrThrow, getSupabaseClient, toDatabaseRow } from './base'
import type { ProfileValues } from '@/schemas/profile'
import type { Profile } from '@/types/entities'

/**
 * The portfolio owner: name, headline, bio, avatar, contact details.
 *
 * A single row, so an absent row means "not configured yet" rather than an error. Returns
 * `null` in that case, which pages render as an empty state rather than an error — an
 * unfinished profile is a normal state, not a failure.
 */
export async function getProfile(): Promise<Profile | null> {
  return fetchFirst<'profile'>(
    () => getSupabaseClient().from('profile').select('*').limit(1),
    'Could not load the profile.',
  )
}

/**
 * Creates the profile row the first time, then updates it on every save after that.
 *
 * The decision is made by reading the current row rather than by hardcoding the seeded id,
 * because a profile created from this form gets a fresh UUID and callers should not have to
 * know any id at all.
 *
 * `profile_singleton_guard` is a unique index over the constant `true`, so Postgres will
 * reject a second row even if this function were changed to always insert. That makes the
 * read-then-write safe: the worst case is a unique-violation error surfaced as a failed
 * save, not a duplicated profile.
 */
export async function saveProfile(values: ProfileValues): Promise<Profile> {
  const existing = await getProfile()
  const client = getSupabaseClient()

  if (existing) {
    return fetchOneOrThrow<'profile'>(
      () =>
        client
          .from('profile')
          .update(toDatabaseRow<'profile'>(values))
          .eq('id', existing.id)
          .select()
          .limit(1),
      'Could not save the profile.',
    )
  }

  return fetchOneOrThrow<'profile'>(
    () => client.from('profile').insert(toDatabaseRow<'profile'>(values)).select().limit(1),
    'Could not save the profile.',
  )
}
