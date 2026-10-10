import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { optionalText } from './fields'

/**
 * The one editable field on a stored file.
 *
 * A media row's other columns describe the object itself — its name, size, and dimensions
 * are facts about the bytes, not choices the owner makes, so there is nothing else to edit.
 * Alt text is the exception because it is the one thing about an existing upload that can be
 * wrong, and correcting it should not require re-uploading the file.
 *
 * Optional because it only means anything for an image. A PDF has no alt text, and the
 * library says so rather than asking for a description of a document nobody reads.
 */
export const mediaDetailsSchema = z.object({
  altText: optionalText(VALIDATION_LIMITS.imageAltText.max, 'Alt text'),
})

export type MediaDetailsValues = z.infer<typeof mediaDetailsSchema>
