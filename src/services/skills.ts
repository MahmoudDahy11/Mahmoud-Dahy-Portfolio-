import { fetchOneOrThrow, fetchRows, getSupabaseClient, toDatabaseRow } from './base'
import { toFieldOption } from '@/utils/toFieldOption'
import type { SkillCategoryValues, SkillValues } from '@/schemas/skills'
import type { Row, Skill, SkillCategory } from '@/types/entities'

/**
 * A skill with its category resolved.
 *
 * The relation is requested from the database but is absent from the generated `Skill`
 * type, because generated types describe tables and not the particular joins a query
 * happens to make. It is declared here, next to the query that produces it, so the two
 * cannot drift apart.
 */
export type SkillWithCategory = Skill & {
  skillCategories: Pick<SkillCategory, 'id' | 'name' | 'slug' | 'sortOrder'> | null
}

/** A joined skill row as it comes back, before `field` is narrowed. */
type RawSkillWithCategory = Row<'skills'> & {
  skillCategories: Pick<SkillCategory, 'id' | 'name' | 'slug' | 'sortOrder'> | null
}

/**
 * Narrows `field` on a joined skill row.
 *
 * The value arrives as `string`; `toFieldOption` turns it into a `FieldOption`, the same
 * conversion `getSiteSettings` makes for `defaultTheme`.
 */
function toSkillWithCategory(row: RawSkillWithCategory): SkillWithCategory {
  return { ...row, field: toFieldOption(row.field) }
}

/** Narrows `field` on a plain skill row. */
function toSkill(row: Row<'skills'>): Skill {
  return { ...row, field: toFieldOption(row.field) }
}

/** Narrows `field` on a category row. */
function toSkillCategory(row: Row<'skill_categories'>): SkillCategory {
  return { ...row, field: toFieldOption(row.field) }
}

/**
 * Published skills with their category attached.
 *
 * `skill_categories(...)` is a PostgREST embedded resource, so the category arrives in the
 * same round trip. That means the Skills page needs one query rather than two plus a
 * client-side join.
 *
 * The embed is a *left* join, not `!inner`. `category_id` is nullable, and this was
 * verified against the live API: an inner join silently drops a skill that has no
 * category, so the owner would add a skill, see it missing, and have no explanation. A
 * left join returns `skillCategories: null` for that row, and the UI groups it under
 * "Other" — the skill is visible, which is the behaviour that matches the constraint.
 */
export async function getSkills(): Promise<SkillWithCategory[]> {
  const rows = await fetchRows<'skills'>(
    () =>
      getSupabaseClient()
        .from('skills')
        .select('*, skill_categories(id, name, slug, sort_order)')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
    'Could not load the skills.',
  )

  return (rows as RawSkillWithCategory[]).map(toSkillWithCategory)
}

/** Categories in owner-defined order. Used for grouping and for the admin form. */
export async function getSkillCategories(): Promise<SkillCategory[]> {
  const rows = await fetchRows<'skill_categories'>(
    () =>
      getSupabaseClient()
        .from('skill_categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
    'Could not load the skill categories.',
  )

  return rows.map(toSkillCategory)
}

/**
 * Every skill with its category attached, drafts included.
 *
 * Same left join as the public read, and for the same reason: an uncategorised skill must
 * appear in the admin table, or the owner cannot see or fix the row they just created.
 */
export async function getAllSkills(): Promise<SkillWithCategory[]> {
  const rows = await fetchRows<'skills'>(
    () =>
      getSupabaseClient()
        .from('skills')
        .select('*, skill_categories(id, name, slug, sort_order)')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
    'Could not load the skills.',
  )

  return (rows as RawSkillWithCategory[]).map(toSkillWithCategory)
}

export async function createSkill(values: SkillValues): Promise<Skill> {
  return toSkill(
    await fetchOneOrThrow<'skills'>(
      () => getSupabaseClient().from('skills').insert(toDatabaseRow<'skills'>(values)).select().limit(1),
      'Could not save the skill.',
    ),
  )
}

export async function updateSkill(id: string, values: SkillValues): Promise<Skill> {
  return toSkill(
    await fetchOneOrThrow<'skills'>(
      () =>
        getSupabaseClient()
          .from('skills')
          .update(toDatabaseRow<'skills'>(values))
          .eq('id', id)
          .select()
          .limit(1),
      'Could not save the skill.',
    ),
  )
}

/**
 * Deletes a skill.
 *
 * `skills` is referenced by nothing, so this removes the row outright.
 */
export async function deleteSkill(id: string): Promise<void> {
  await fetchRows<'skills'>(
    () => getSupabaseClient().from('skills').delete().eq('id', id).select(),
    'Could not delete the skill.',
  )
}

export async function createSkillCategory(values: SkillCategoryValues): Promise<SkillCategory> {
  return toSkillCategory(
    await fetchOneOrThrow<'skill_categories'>(
      () =>
        getSupabaseClient()
          .from('skill_categories')
          .insert(toDatabaseRow<'skill_categories'>(values))
          .select()
          .limit(1),
      'Could not save the category.',
    ),
  )
}

export async function updateSkillCategory(
  id: string,
  values: SkillCategoryValues,
): Promise<SkillCategory> {
  return toSkillCategory(
    await fetchOneOrThrow<'skill_categories'>(
      () =>
        getSupabaseClient()
          .from('skill_categories')
          .update(toDatabaseRow<'skill_categories'>(values))
          .eq('id', id)
          .select()
          .limit(1),
      'Could not save the category.',
    ),
  )
}

/**
 * Deletes a category.
 *
 * `skills.category_id` is `on delete set null`, so the skills themselves survive and become
 * uncategorised rather than disappearing. That is why the confirmation dialog warns about the
 * skills rather than the rows being removed.
 */
export async function deleteSkillCategory(id: string): Promise<void> {
  await fetchRows<'skill_categories'>(
    () => getSupabaseClient().from('skill_categories').delete().eq('id', id).select(),
    'Could not delete the category.',
  )
}
