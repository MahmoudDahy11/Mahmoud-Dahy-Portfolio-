import { describe, expect, it } from 'vitest'
import { projectToFormValues, EMPTY_PROJECT } from '@/features/projects/ProjectDialog'
import { filterProjectsByField } from '@/features/projects'
import type { ProjectWithRelations } from '@/types/entities'

const storedProject: ProjectWithRelations = {
  id: 'p1',
  title: 'App',
  slug: 'app',
  summary: null,
  description: null,
  coverImagePath: null,
  repositoryUrl: null,
  liveUrl: null,
  role: null,
  clientName: null,
  startedAt: null,
  endedAt: null,
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
  field: 'software',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  images: [],
  technologies: [],
}

describe('filterProjectsByField', () => {
  const mixed: ProjectWithRelations[] = [
    { ...storedProject, id: 's1', title: 'Mobile', field: 'software' },
    { ...storedProject, id: 'e1', title: 'Panel', field: 'elv' },
  ]

  it('keeps every project when the filter is "all"', () => {
    expect(filterProjectsByField(mixed, 'all')).toHaveLength(2)
  })

  it('keeps only the chosen field', () => {
    expect(filterProjectsByField(mixed, 'elv').map((p) => p.title)).toEqual(['Panel'])
    expect(filterProjectsByField(mixed, 'software').map((p) => p.title)).toEqual(['Mobile'])
  })
})

describe('projectToFormValues', () => {
  it('includes the project field', () => {
    expect(projectToFormValues(storedProject).field).toBe('software')
  })

  it('uses software as default for empty project', () => {
    expect(EMPTY_PROJECT.field).toBe('software')
  })
})
