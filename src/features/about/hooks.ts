import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useCrudMutations } from '@/lib/crudMutations'
import {
  createAboutSection,
  deleteAboutSection,
  getAboutSections,
  getAllAboutSections,
  updateAboutSection,
} from '@/services/about'
import type { AboutSectionValues } from '@/schemas/about'

/** The published blocks that make up the About page. */
export function useAboutSections() {
  return useQuery({
    queryKey: queryKeys.about.sections(),
    queryFn: getAboutSections,
  })
}

/** Every block, drafts included. The admin table is the only caller. */
export function useAllAboutSections() {
  return useQuery({
    queryKey: queryKeys.about.all(),
    queryFn: getAllAboutSections,
  })
}

/** Create, update, and delete for About page blocks. */
export function useAboutSectionMutations() {
  return useCrudMutations<AboutSectionValues, { id: string; values: AboutSectionValues }>({
    queryKey: queryKeys.about.all(),
    relatedKeys: [queryKeys.about.sections()],
    create: createAboutSection,
    update: ({ id, values }) => updateAboutSection(id, values),
    remove: deleteAboutSection,
    messages: {
      created: 'Section added.',
      updated: 'Section saved.',
      deleted: 'Section deleted.',
    },
  })
}
