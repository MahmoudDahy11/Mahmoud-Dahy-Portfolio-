import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/constants/validation'
import { FIELD_OPTIONS } from '@/constants/fields'
import { optionalNumberField, optionalText, requiredText, slugField, sortOrderField } from './fields'

/**
 * A skill.
 *
 * `proficiency` mirrors the `skills_proficiency_check` constraint, so the form and the
 * database agree on the 0–100 range. A blank field means "no rating", which is different
 * from a rating of zero and is stored as NULL.
 *
 * `categoryId` is a plain string here rather than a UUID type, because the value comes from
 * a `<select>` and the "no category" option is the empty string. The service stores `NULL`
 * for it, which is what keeps an uncategorised skill visible instead of being dropped by a
 * join.
 */
export const skillSchema = z.object({
  name: requiredText('Name', VALIDATION_LIMITS.skillName),
  // The Software / ELV track this skill belongs to. A required choice rather than an
  // optional one, because every skill is shown under exactly one field on the public site.
  field: z.enum(FIELD_OPTIONS),
  categoryId: z.string().optional().or(z.literal('')),
  // A cleared rating is an explicit `null`, so "no rating" can actually be restored after
  // a rating was set. `percentageField` dropped a cleared input as `undefined`, which the
  // service layer omits from the payload, leaving the old rating in place.
  proficiency: optionalNumberField('Proficiency', { min: 0, max: 100 }),
  iconPath: optionalText(VALIDATION_LIMITS.url.max, 'Icon'),
  sortOrder: sortOrderField,
  isPublished: z.boolean(),
})

export type SkillValues = z.infer<typeof skillSchema>

/** A skill category. The slug is unique, so it doubles as a stable identifier. */
export const skillCategorySchema = z.object({
  name: requiredText('Name', VALIDATION_LIMITS.categoryName),
  field: z.enum(FIELD_OPTIONS),
  slug: slugField('Slug'),
  sortOrder: sortOrderField,
})

export type SkillCategoryValues = z.infer<typeof skillCategorySchema>

/** An entry in the technology catalogue that projects are filtered by. */
export const technologySchema = z.object({
  name: requiredText('Name', VALIDATION_LIMITS.technologyName),
  slug: slugField('Slug'),
  iconPath: optionalText(VALIDATION_LIMITS.url.max, 'Icon'),
  sortOrder: sortOrderField,
})

export type TechnologyValues = z.infer<typeof technologySchema>
