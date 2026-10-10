import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { emailField, requiredText } from './fields'

/**
 * Public contact form.
 *
 * The length limits match the `contact_messages` CHECK constraints exactly, so a message
 * that passes here is one the database will accept. That is worth being precise about: the
 * constraints are the first line of defence against a junk inbox, and a form that accepted
 * longer values would only move the failure to a raw database error.
 */
export const contactSchema = z.object({
  name: requiredText('Name', { min: 2, max: 120 }),
  email: emailField,
  subject: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.messageSubject.max, {
      message: `Subject must be ${VALIDATION_LIMITS.messageSubject.max} characters or fewer.`,
    })
    .optional()
    .or(z.literal('')),
  message: requiredText('Message', {
    min: VALIDATION_LIMITS.message.min,
    max: VALIDATION_LIMITS.message.max,
  }),
  // A hidden field a human never sees. Bots that fill every input populate it, which lets
  // the submit handler discard the submission quietly.
  website: z.literal('').optional(),
})

export type ContactValues = z.infer<typeof contactSchema>
