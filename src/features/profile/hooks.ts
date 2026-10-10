import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useSaveMutation } from '@/lib/saveMutation'
import { getProfile, saveProfile } from '@/services/profile'
import type { ProfileValues } from '@/schemas/profile'

/**
 * The owner: name, headline, bio, avatar, contact details.
 *
 * Read on nearly every public page, so it is fetched once and shared through the query
 * cache rather than requested per page.
 *
 * `staleTime` is deliberately longer than the default 60s. The profile changes rarely and
 * appears in the header of every page; refetching it on each navigation would be a request
 * per page view for a value that does not change.
 */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: getProfile,
    staleTime: 5 * 60_000,
  })
}

/** Saves the one profile row, creating it the first time the form is used. */
export function useProfileMutation() {
  return useSaveMutation<ProfileValues>({
    queryKey: queryKeys.profile(),
    save: saveProfile,
    successMessage: 'Profile saved.',
    errorMessage: 'Could not save the profile. Nothing was changed.',
  })
}
