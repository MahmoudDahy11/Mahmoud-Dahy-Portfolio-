/**
 * The professional fields the portfolio separates content by.
 *
 * "Field" is the Software / ELV track a piece of content belongs to. The values mirror the
 * `field` CHECK constraint on `skills` and `skill_categories`, so the union here and the
 * database agree on what is legal — the same arrangement as `THEME_OPTIONS`.
 *
 * Software and ELV are the only two tracks today. Adding a third is a migration plus one
 * entry here, and every consumer (the schemas, the admin filters, the hero selector) picks
 * it up from this list rather than from a hard-coded pair.
 */

export const FIELD_OPTIONS = ['software', 'elv'] as const

/** The same values as a type, for places that store one rather than offer a choice. */
export type FieldOption = (typeof FIELD_OPTIONS)[number]

/** Human labels, shown on the admin filters and the hero selector. */
export const FIELD_LABELS: Record<FieldOption, string> = {
  software: 'Software',
  elv: 'ELV',
}

/**
 * A public filter value: one field, or every field at once.
 *
 * "All" is not a field — it is stored in no row and must never reach the database, so it
 * lives here as a filter-only value rather than in `FIELD_OPTIONS`. The admin tables keep
 * using `FieldOption` (they always show one field); the public selectors use `FieldFilter`.
 */
export const ALL_FIELDS = 'all' as const

/** The filter values in display order: everything first, then each field. */
export const FIELD_FILTER_OPTIONS = [ALL_FIELDS, ...FIELD_OPTIONS] as const

export type FieldFilter = (typeof FIELD_FILTER_OPTIONS)[number]

/** Labels for the public filter, including "All". */
export const FIELD_FILTER_LABELS: Record<FieldFilter, string> = {
  all: 'All',
  ...FIELD_LABELS,
}
