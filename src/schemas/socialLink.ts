import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { requiredText, sortOrderField } from './fields'

/**
 * A link to another profile or account.
 *
 * `platform` is required because `social_links` has a non-empty CHECK constraint on it, and
 * it is also what the public footer uses to pick an icon. `label` is the visible text, so
 * two links to the same platform can be distinguished — "Work" and "Writing", for example.
 */
export const socialLinkSchema = z.object({
  platform: requiredText('Platform', VALIDATION_LIMITS.socialPlatform),
  label: requiredText('Label', VALIDATION_LIMITS.socialLabel),
  url: z
    .string()
    .trim()
    .min(1, { message: 'URL is required.' })
    .max(VALIDATION_LIMITS.url.max, { message: 'URL is too long.' })
    .refine((value) => /^https?:\/\/.+/i.test(value), {
      message: 'URL must start with http:// or https://',
    }),
  iconPath: z.string().optional().or(z.literal('')),
  sortOrder: sortOrderField,
  isPublished: z.boolean(),
})

export type SocialLinkValues = z.infer<typeof socialLinkSchema>
