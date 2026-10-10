import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { optionalNumberField, optionalText, requiredText, storagePathField } from './fields'

/**
 * The profile editor.
 *
 * `profile` is a single-row table, so this form is the only place the owner's name,
 * headline, and bio exist. `fullName` is the only required field because it is the one
 * value the public site cannot render without; everything else has a sensible blank.
 */
export const profileSchema = z.object({
  fullName: requiredText('Full name', VALIDATION_LIMITS.fullName),
  headline: optionalText(VALIDATION_LIMITS.headline.max, 'Headline'),
  shortBio: optionalText(VALIDATION_LIMITS.shortBio.max, 'Short bio'),
  bio: optionalText(VALIDATION_LIMITS.bio.max, 'Bio'),
  location: optionalText(VALIDATION_LIMITS.location.max, 'Location'),
  email: z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.email.max, { message: 'Email is too long.' })
    .refine((value) => value === '' || z.email().safeParse(value).success, {
      message: 'Enter a valid email address.',
    })
    .optional()
    .or(z.literal('')),
  phone: optionalText(VALIDATION_LIMITS.phone.max, 'Phone'),
  availabilityStatus: optionalText(VALIDATION_LIMITS.availabilityStatus.max, 'Availability'),
  // Storage paths, not URLs. The public hero, about page, and resume link all read these
  // columns, so they belong on the only form that can write the profile row.
  avatarPath: storagePathField('Avatar path'),
  coverPath: storagePathField('Cover path'),
  resumePath: storagePathField('Resume path'),
  // A cleared field is an explicit `null`, which is what actually clears the value in the
  // database. `optionalNumberField` does that conversion; a plain number dropped as
  // `undefined` would leave the old value in place and the save would do nothing.
  yearsOfExperience: optionalNumberField('Years of experience', {
    min: 0,
    max: VALIDATION_LIMITS.yearsOfExperience.max,
  }),
})

export type ProfileValues = z.infer<typeof profileSchema>
