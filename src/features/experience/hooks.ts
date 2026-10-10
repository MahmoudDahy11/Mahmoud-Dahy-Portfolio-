import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useCrudMutations } from '@/lib/crudMutations'
import {
  createExperience,
  deleteExperience,
  getAllExperiences,
  getExperiences,
  updateExperience,
} from '@/services/experience'
import type { ExperienceValues } from '@/schemas/experience'

/** Published employment history, most recent role first. */
export function useExperiences() {
  return useQuery({
    queryKey: queryKeys.experiences.list(),
    queryFn: getExperiences,
  })
}

/** Every role, drafts included. The admin table is the only caller. */
export function useAllExperiences() {
  return useQuery({
    queryKey: queryKeys.experiences.all(),
    queryFn: getAllExperiences,
  })
}

/**
 * Create, update, and delete for roles.
 *
 * The public timeline is refreshed as well as the admin table, because publishing a role
 * changes what a visitor sees — the two lists answer different questions and cannot share
 * one cache entry.
 */
export function useExperienceMutations() {
  return useCrudMutations<ExperienceValues, { id: string; values: ExperienceValues }>({
    queryKey: queryKeys.experiences.all(),
    relatedKeys: [queryKeys.experiences.list()],
    create: createExperience,
    update: ({ id, values }) => updateExperience(id, values),
    remove: deleteExperience,
    messages: {
      created: 'Role added.',
      updated: 'Role saved.',
      deleted: 'Role deleted.',
    },
  })
}
