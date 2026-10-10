import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useCrudMutations } from '@/lib/crudMutations'
import { createEducation, deleteEducation, getAllEducations, getEducations, updateEducation } from '@/services/education'
import type { EducationValues } from '@/schemas/education'

/** Published academic history, most recent qualification first. */
export function useEducations() {
  return useQuery({
    queryKey: queryKeys.education.list(),
    queryFn: getEducations,
  })
}

/** Every entry, drafts included. The admin table is the only caller. */
export function useAllEducations() {
  return useQuery({
    queryKey: queryKeys.education.all(),
    queryFn: getAllEducations,
  })
}

/** Create, update, and delete for education entries. */
export function useEducationMutations() {
  return useCrudMutations<EducationValues, { id: string; values: EducationValues }>({
    queryKey: queryKeys.education.all(),
    relatedKeys: [queryKeys.education.list()],
    create: createEducation,
    update: ({ id, values }) => updateEducation(id, values),
    remove: deleteEducation,
    messages: {
      created: 'Entry added.',
      updated: 'Entry saved.',
      deleted: 'Entry deleted.',
    },
  })
}
