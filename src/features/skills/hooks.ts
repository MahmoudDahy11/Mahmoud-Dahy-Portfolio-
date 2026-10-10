import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useCrudMutations } from '@/lib/crudMutations'
import {
  createSkill,
  createSkillCategory,
  deleteSkill,
  deleteSkillCategory,
  getAllSkills,
  getSkillCategories,
  getSkills,
  updateSkill,
  updateSkillCategory,
  type SkillWithCategory,
} from '@/services/skills'
import type { SkillCategoryValues, SkillValues } from '@/schemas/skills'

/** Published skills with their category attached. */
export function useSkills() {
  return useQuery({
    queryKey: queryKeys.skills.list(),
    queryFn: getSkills,
  })
}

/** Skill categories in owner-defined order. */
export function useSkillCategories() {
  return useQuery({
    queryKey: queryKeys.skills.categories(),
    queryFn: getSkillCategories,
  })
}

/** Every skill, drafts included. The admin table is the only caller. */
export function useAllSkills() {
  return useQuery({
    queryKey: queryKeys.skills.all(),
    queryFn: getAllSkills,
  })
}

/**
 * Create, update, and delete for skills.
 *
 * The categories are refreshed too, because a skill carries its category's *name* — the
 * public page groups by that name — so renaming a category changes the group heading for
 * every skill in it.
 */
export function useSkillMutations() {
  return useCrudMutations<SkillValues, { id: string; values: SkillValues }>({
    queryKey: queryKeys.skills.all(),
    relatedKeys: [queryKeys.skills.list(), queryKeys.skills.categories()],
    create: createSkill,
    update: ({ id, values }) => updateSkill(id, values),
    remove: deleteSkill,
    messages: {
      created: 'Skill added.',
      updated: 'Skill saved.',
      deleted: 'Skill deleted.',
    },
  })
}

/**
 * Create, update, and delete for skill categories.
 *
 * The skill lists are refreshed as well, since every skill row displays its category name.
 * A category that has no `is_published` of its own — the column does not exist on the table —
 * is still live the moment a skill uses it.
 */
export function useSkillCategoryMutations() {
  return useCrudMutations<SkillCategoryValues, { id: string; values: SkillCategoryValues }>({
    queryKey: queryKeys.skills.categories(),
    relatedKeys: [queryKeys.skills.all(), queryKeys.skills.list()],
    create: createSkillCategory,
    update: ({ id, values }) => updateSkillCategory(id, values),
    remove: deleteSkillCategory,
    messages: {
      created: 'Category added.',
      updated: 'Category saved.',
      deleted: 'Category deleted.',
    },
  })
}

export type { SkillWithCategory }
