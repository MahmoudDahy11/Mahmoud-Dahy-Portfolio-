import { z } from 'zod'
import { THEME_OPTIONS, VALIDATION_LIMITS } from '@/constants/validation'
import { optionalText, requiredText, storagePathField } from './fields'

/**
 * Site settings editor.
 *
 * Single-row, like `profile`. `siteTitle` is required because `usePageSeo` builds every page
 * title from it, and a blank value would produce a browser tab reading nothing at all.
 *
 * `defaultTheme` mirrors the `site_settings_default_theme_check` constraint, so the form
 * cannot offer a value the database would reject.
 */
export const siteSettingsSchema = z.object({
  siteTitle: requiredText('Site title', VALIDATION_LIMITS.siteTitle),
  metaDescription: optionalText(VALIDATION_LIMITS.metaDescription.max, 'Meta description'),
  footerText: optionalText(VALIDATION_LIMITS.footerText.max, 'Footer text'),
  copyrightText: optionalText(VALIDATION_LIMITS.copyrightText.max, 'Copyright text'),
  // Used as the Open Graph and Twitter preview image when a page supplies none of its own.
  ogImagePath: storagePathField('Social preview image path'),
  defaultTheme: z.enum(THEME_OPTIONS, { message: 'Choose a theme.' }),
  showAvailabilityBadge: z.boolean(),
})

export type SiteSettingsValues = z.infer<typeof siteSettingsSchema>
