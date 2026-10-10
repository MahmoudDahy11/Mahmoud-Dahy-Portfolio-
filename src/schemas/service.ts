import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { optionalText, requiredText, sortOrderField } from './fields'

/**
 * A service the owner offers.
 *
 * `priceHint` is free text on purpose — "From $500", "Negotiable", and "Contact me" are
 * all reasonable answers, and a numeric field would force a currency model the portfolio
 * does not need.
 */
export const serviceSchema = z.object({
  title: requiredText('Title', VALIDATION_LIMITS.serviceTitle),
  description: requiredText('Description', {
    min: 1,
    max: VALIDATION_LIMITS.serviceDescription.max,
  }),
  iconPath: optionalText(VALIDATION_LIMITS.url.max, 'Icon'),
  priceHint: optionalText(VALIDATION_LIMITS.priceHint.max, 'Price hint'),
  sortOrder: sortOrderField,
  isPublished: z.boolean(),
})

export type ServiceValues = z.infer<typeof serviceSchema>
