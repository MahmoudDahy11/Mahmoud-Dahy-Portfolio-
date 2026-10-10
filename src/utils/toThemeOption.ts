import { THEME_OPTIONS, type ThemeOption } from '@/constants/validation'

/**
 * Narrows a stored theme string to the three values the database accepts.
 *
 * `site_settings.default_theme` is `text` with a CHECK constraint, and the generated type
 * in `src/types/database.ts` reflects the column type rather than the constraint — so the
 * value arrives as `string` even though Postgres cannot store anything else. This is where
 * that becomes a `ThemeOption`, so the settings form can offer it as a choice.
 *
 * The fallback is unreachable while the constraint exists. It returns `'system'` rather than
 * throwing so that a value added to the column without updating the app degrades to a
 * working page instead of a blank one; a visitor following their OS is a safe thing to fall
 * back to.
 */
export function toThemeOption(value: string | null | undefined): ThemeOption {
  return THEME_OPTIONS.includes(value as ThemeOption) ? (value as ThemeOption) : 'system'
}
