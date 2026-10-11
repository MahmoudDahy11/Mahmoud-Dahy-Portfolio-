import { FIELD_OPTIONS, type FieldOption } from '@/constants/fields'

/**
 * Narrows a stored field string to the two values the database accepts.
 *
 * `skills.field` and `skill_categories.field` are `text` with a CHECK constraint, and the
 * generated type in `src/types/database.ts` reflects the column type rather than the
 * constraint — so the value arrives as `string` even though Postgres cannot store anything
 * else. This is where that becomes a `FieldOption`, so the UI can index labels and offer
 * the value as a choice.
 *
 * The fallback is unreachable while the constraint exists. It returns `'software'` rather
 * than throwing so that a value added to the column without updating the app degrades to a
 * working page instead of a blank one, and `'software'` is the column default and the
 * meaning every pre-existing row has.
 */
export function toFieldOption(value: string | null | undefined): FieldOption {
  return FIELD_OPTIONS.includes(value as FieldOption) ? (value as FieldOption) : FIELD_OPTIONS[0]
}
