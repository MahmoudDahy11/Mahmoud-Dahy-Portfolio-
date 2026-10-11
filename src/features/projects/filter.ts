import type { FieldFilter } from '@/constants/fields'
import type { ProjectWithRelations } from '@/types/entities'

export function filterProjectsByField(
  projects: ProjectWithRelations[],
  filter: FieldFilter,
): ProjectWithRelations[] {
  if (filter === 'all') return projects
  return projects.filter((project) => project.field === filter)
}
