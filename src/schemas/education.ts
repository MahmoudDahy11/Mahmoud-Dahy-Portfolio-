import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { optionalDate, optionalText, requiredText, sortOrderField } from './fields'

/**
 * An entry in the education timeline.
 *
 * Both dates are optional here, unlike experience: an ongoing course has no end date, and
 * some entries are a single event with no start at all. The order check is still applied
 * whenever both are present.
 */
export const educationSchema = z
  .object({
    institution: requiredText('Institution', VALIDATION_LIMITS.institution),
    // Required, unlike the surrounding fields, because `educations.degree` is NOT NULL in the
    // database. The form asks for it so the owner gets a clear message here, instead of a
    // not-null violation arriving from Postgres after the save.
    degree: requiredText('Degree', VALIDATION_LIMITS.degree),
    fieldOfStudy: optionalText(VALIDATION_LIMITS.fieldOfStudy.max, 'Field of study'),
    description: optionalText(VALIDATION_LIMITS.serviceDescription.max, 'Description'),
    logoPath: optionalText(VALIDATION_LIMITS.url.max, 'Logo'),
    startDate: optionalDate('Start date'),
    endDate: optionalDate('End date'),
    grade: optionalText(VALIDATION_LIMITS.grade.max, 'Grade'),
    sortOrder: sortOrderField,
    isPublished: z.boolean(),
  })
  .refine((values) => !values.startDate || !values.endDate || values.endDate >= values.startDate, {
    message: 'The end date cannot be before the start date.',
    path: ['endDate'],
  })

export type EducationValues = z.infer<typeof educationSchema>
