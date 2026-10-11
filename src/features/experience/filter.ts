import type { FieldFilter } from '@/constants/fields'
import type { Experience } from '@/types/entities'

export function filterExperiencesByField(
  experiences: Experience[],
  filter: FieldFilter,
): Experience[] {
  if (filter === 'all') return experiences
  return experiences.filter((experience) => experience.field === filter)
}
