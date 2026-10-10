import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { optionalDate, optionalText, requiredText, sortOrderField } from './fields'

/**
 * A role in the experience timeline.
 *
 * The refinement mirrors `experiences_current_dates_check`: a role marked as current must
 * not also have an end date. The database rejects that combination, so the form rejects it
 * first with a message that says what to do about it.
 */
export const experienceSchema = z
  .object({
    company: requiredText('Company', VALIDATION_LIMITS.company),
    title: requiredText('Job title', VALIDATION_LIMITS.jobTitle),
    description: optionalText(VALIDATION_LIMITS.serviceDescription.max, 'Description'),
    location: optionalText(VALIDATION_LIMITS.location.max, 'Location'),
    employmentType: optionalText(VALIDATION_LIMITS.employmentType.max, 'Employment type'),
    startDate: z
      .string()
      .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), { message: 'Start date is required.' }),
    endDate: optionalDate('End date'),
    isCurrent: z.boolean(),
    sortOrder: sortOrderField,
    isPublished: z.boolean(),
  })
  .refine((values) => !values.isCurrent || !values.endDate, {
    message: 'A current role has no end date. Clear the end date, or turn off "current".',
    path: ['endDate'],
  })
  .refine((values) => !values.endDate || values.endDate >= values.startDate, {
    message: 'The end date cannot be before the start date.',
    path: ['endDate'],
  })

export type ExperienceValues = z.infer<typeof experienceSchema>
