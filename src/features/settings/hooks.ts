import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useSaveMutation } from '@/lib/saveMutation'
import { getSiteSettings, saveSiteSettings } from '@/services/siteSettings'
import type { SiteSettingsValues } from '@/schemas/siteSettings'

/**
 * Site-wide configuration: title, meta description, footer text, default theme.
 *
 * Read once by the layout, so it is cached for the whole session.
 */
export function useSiteSettings() {
  return useQuery({
    queryKey: queryKeys.siteSettings(),
    queryFn: getSiteSettings,
    staleTime: 5 * 60_000,
  })
}

/** Saves the one settings row, creating it the first time the form is used. */
export function useSiteSettingsMutation() {
  return useSaveMutation<SiteSettingsValues>({
    queryKey: queryKeys.siteSettings(),
    save: saveSiteSettings,
    successMessage: 'Settings saved.',
    errorMessage: 'Could not save the settings. Nothing was changed.',
  })
}

