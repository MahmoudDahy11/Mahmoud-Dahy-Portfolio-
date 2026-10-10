import { z } from 'zod'
import { SLUG_RULES, VALIDATION_LIMITS } from '@/constants/validation'

/**
 * Reusable field rules.
 *
 * These are declared once because the same handful of shapes appear in nearly every admin
 * form — a required name, an optional paragraph, a URL, a date, a sort position — and each
 * one has a matching constraint in the database. Declaring them in one place is what keeps
 * "what the form accepts" and "what the database accepts" from drifting apart.
 *
 * Two conventions are worth knowing:
 *
 * 1. Optional text stays a *string* in the form, never `null`. An HTML input can only
 *    produce a string, so a form that used `null` would need a conversion in every field.
 *    An empty string means "no value" and the service layer stores it as `NULL`.
 * 2. Numbers and dates are validated as the strings the browser produces, then converted
 *    by the field components. Validating a number the browser cannot represent is how a
 *    date field ends up rejecting a perfectly valid date.
 */

/** A value the owner must provide. */
export const requiredText = (label: string, { min = 1, max }: { min?: number; max: number }) =>
  z
    .string()
    .trim()
    .min(min, {
      // "must be at least 1 characters" is what a required field would otherwise say, and
      // these messages are shown to the owner, not read by a machine.
      message: min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`,
    })
    .max(max, { message: `${label} must be ${max} characters or fewer.` })

/** A value the owner may leave blank. */
export const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { message: `${label} must be ${max} characters or fewer.` })
    .optional()
    .or(z.literal(''))

/** A URL the owner may leave blank. Must be absolute, so a typo cannot become a dead link. */
export const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.url.max, { message: `${label} is too long.` })
    .refine((value) => value === '' || /^https?:\/\/.+/i.test(value), {
      message: `${label} must start with http:// or https://`,
    })
    .optional()
    .or(z.literal(''))

/** `user@example.com`. */
export const emailField = z
  .string()
  .trim()
  .min(1, { message: 'Email is required.' })
  .max(VALIDATION_LIMITS.email.max, { message: 'Email is too long.' })
  .email({ message: 'Enter a valid email address.' })

/**
 * A date, in the `yyyy-mm-dd` an `<input type="date">` produces.
 *
 * Not parsed into a `Date`, because a timezone can shift a date by a day and the value is
 * stored and displayed as a calendar date with no time component.
 */
export const optionalDate = (label: string) =>
  z
    .string()
    .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: `${label} must be a valid date.`,
    })
    .optional()
    .or(z.literal(''))

/**
 * A whole number from a `<input type="number">`.
 *
 * `max` is a safety limit for the field, not a validation rule: an absurd sort order is a
 * typo, not a value worth storing.
 */
export const numberField = (label: string, { min = 0, max = 100_000 }: { min?: number; max?: number }) =>
  z
    .number({ message: `${label} must be a number.` })
    .int(`${label} must be a whole number.`)
    .min(min, { message: `${label} must be at least ${min}.` })
    .max(max, { message: `${label} must be ${max} or less.` });

/**
 * An optional whole number the owner can clear.
 *
 * A cleared `<input type="number">` must mean "clear the column", and it can only mean that
 * if the value that reaches the database is an explicit `NULL` — an `undefined` key is
 * dropped by the service layer, so the column would silently keep its old value and a save
 * would appear to do nothing. `NumberField` converts an empty input to `null`, and this
 * schema accepts that `null` alongside a real number.
 *
 * The plain `numberField` used for required numbers (sort order) deliberately does not
 * accept `null`: those columns are NOT NULL, so clearing one is a mistake the form should
 * reject, not a value it should write.
 */
export const optionalNumberField = (
  label: string,
  { min = 0, max = 100_000 }: { min?: number; max?: number },
) =>
  z.union([
    z.literal('').transform(() => null),
    numberField(label, { min, max }).nullable().optional(),
  ]);

/**
 * A URL slug, matching the unique columns `projects.slug`, `technologies.slug`, and
 * `skill_categories.slug`.
 */
export const slugField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} is required.` })
    .max(SLUG_RULES.maxLength, { message: `${label} must be ${SLUG_RULES.maxLength} characters or fewer.` })
    .regex(SLUG_RULES.pattern, {
      message: `${label} may use lowercase letters, numbers, and single hyphens only.`,
    });

/** Manual ordering. Every content table has one, and a blank value means "not set". */
export const sortOrderField = numberField('Sort order', { min: 0, max: 9999 });

/**
 * A Supabase Storage object key, as stored in the `*_path` columns.
 *
 * Length is the only rule the database imposes, but there is a second failure worth
 * preventing here. These columns are read by `imageUrl` and `fileUrl`, which *build* an
 * address from the path rather than using one they are given — so a full URL pasted into
 * `avatar_path` would be turned into nonsense like
 * `<project>/storage/v1/object/public/portfolio-media/https://…` and render as a broken
 * image with nothing in the console to explain it.
 *
 * Rejecting anything containing a scheme catches that mistake at the point it is made. The
 * shape is otherwise left deliberately loose, because object keys are generated by
 * `buildPath` in the media service and the field is not typed by hand in normal use.
 */
export const storagePathField = (label: string) =>
  z
    .string()
    .trim()
    .max(VALIDATION_LIMITS.storagePath.max, {
      message: `${label} must be ${VALIDATION_LIMITS.storagePath.max} characters or fewer.`,
    })
    .refine((value) => !value.includes('://') && !value.startsWith('//'), {
      message: `${label} must be a file path, not a URL.`,
    })
    .optional()
    .or(z.literal(''))
