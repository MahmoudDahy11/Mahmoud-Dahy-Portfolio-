import { fetchFirst, fetchOneOrThrow, getSupabaseClient, toDatabaseRow } from './base'
import { toThemeOption } from '@/utils/toThemeOption'
import type { SiteSettingsValues } from '@/schemas/siteSettings'
import type { SiteSettings } from '@/types/entities'

/**
 * Site-wide configuration: title, meta description, footer text, default theme.
 *
 * A single row, so an absent row means "not configured yet" rather than an error. The
 * document title and footer both fall back to something sensible in that case.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const row = await fetchFirst<'site_settings'>(
    () => getSupabaseClient().from('site_settings').select('*').limit(1),
    'Could not load the site settings.',
  )

  return row ? { ...row, defaultTheme: toThemeOption(row.defaultTheme) } : null
}

/**
 * Creates the settings row the first time, then updates it on every save after that.
 *
 * Mirrors `saveProfile`. As there, the row is found by reading rather than by assuming the
 * seeded id, and `site_settings_singleton_guard` — a unique index over the constant `true` —
 * means Postgres rejects a second row regardless, so the read-then-write cannot duplicate it.
 */
export async function saveSiteSettings(values: SiteSettingsValues): Promise<SiteSettings> {
  const existing = await getSiteSettings()
  const client = getSupabaseClient()

  if (existing) {
    const saved = await fetchOneOrThrow<'site_settings'>(
      () =>
        client
          .from('site_settings')
          .update(toDatabaseRow<'site_settings'>(values))
          .eq('id', existing.id)
          .select()
          .limit(1),
      'Could not save the site settings.',
    )

    return { ...saved, defaultTheme: toThemeOption(saved.defaultTheme) }
  }

  const created = await fetchOneOrThrow<'site_settings'>(
    () => client.from('site_settings').insert(toDatabaseRow<'site_settings'>(values)).select().limit(1),
    'Could not save the site settings.',
  )

  return { ...created, defaultTheme: toThemeOption(created.defaultTheme) }
}
