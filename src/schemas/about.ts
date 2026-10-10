import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { optionalText, requiredText, sortOrderField } from './fields'

/**
 * An About page block.
 *
 * About is built from ordered blocks rather than one long text field so the owner can
 * rearrange the page without rewriting it. `sortOrder` is therefore part of the form, not
 * an afterthought: it is what puts the blocks in the intended order.
 *
 * `imagePath` holds a Storage path, set by the image picker. It is part of the schema
 * because Zod strips keys it does not know, so a field missing here would be silently
 * dropped from the saved row.
 */
export const aboutSectionSchema = z.object({
  title: requiredText('Title', VALIDATION_LIMITS.aboutSectionTitle),
  content: requiredText('Content', { min: 1, max: VALIDATION_LIMITS.aboutSectionContent.max }),
  imagePath: optionalText(VALIDATION_LIMITS.url.max, 'Image'),
  sortOrder: sortOrderField,
  isPublished: z.boolean(),
})

export type AboutSectionValues = z.infer<typeof aboutSectionSchema>
