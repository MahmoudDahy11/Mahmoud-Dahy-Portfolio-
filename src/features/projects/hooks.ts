import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useCrudMutations } from '@/lib/crudMutations'
import {
  createProject,
  deleteProject,
  getAllProjects,
  getProjectBySlug,
  getPublishedProjects,
  getTechnologies,
  updateProject,
} from '@/services/projects'
import {
  createTechnology,
  deleteTechnology,
  updateTechnology,
} from '@/services/technologies'
import type { ProjectValues, TechnologyValues } from '@/schemas'

/**
 * Published projects, with gallery images and technologies resolved.
 *
 * `options` is part of the query key, so a featured-only list and the full list are cached
 * independently rather than one overwriting the other. That is what lets the Home page
 * request three featured projects and the Projects page request all of them without
 * either invalidating the other.
 */
export function useProjects(options?: { featuredOnly?: boolean; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.projects.list(options),
    queryFn: () => getPublishedProjects(options),
  })
}

/**
 * One project by slug.
 *
 * `enabled` skips the request entirely until a slug exists, which avoids firing a query
 * for `undefined` on first render.
 */
export function useProject(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.bySlug(slug ?? ''),
    queryFn: () => getProjectBySlug(slug as string),
    enabled: Boolean(slug),
  })
}

/** The technology catalogue, used by the project filter and the project form. */
export function useTechnologies() {
  return useQuery({
    queryKey: queryKeys.technologies.all(),
    queryFn: getTechnologies,
  })
}

/**
 * Every project, drafts included, for the admin table.
 *
 * A separate hook from `useProjects` rather than a flag on it, because the two answer
 * different questions and are cached under different keys: a change to a draft should
 * refresh the admin table without also refetching the public grid.
 */
export function useAllProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all(),
    queryFn: getAllProjects,
  })
}

/** Create, update, and delete for a project and everything it owns. */
export function useProjectMutations() {
  return useCrudMutations<ProjectValues, { id: string; values: ProjectValues }>({
    queryKey: queryKeys.projects.all(),
    create: createProject,
    update: ({ id, values }) => updateProject(id, values),
    remove: deleteProject,
    messages: {
      created: 'Project created.',
      updated: 'Project saved.',
      deleted: 'Project deleted.',
    },
  })
}

/**
 * Create, update, and delete for the technology catalogue.
 *
 * The project keys are refreshed as well, because a technology's name appears on every
 * project card and in the public filter chips, so changing it changes those pages.
 */
export function useTechnologyMutations() {
  return useCrudMutations<TechnologyValues, { id: string; values: TechnologyValues }>({
    queryKey: queryKeys.technologies.all(),
    relatedKeys: [queryKeys.projects.all()],
    create: createTechnology,
    update: ({ id, values }) => updateTechnology(id, values),
    remove: deleteTechnology,
    messages: {
      created: 'Technology added.',
      updated: 'Technology saved.',
      deleted: 'Technology deleted.',
    },
  })
}
