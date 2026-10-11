import { describe, expect, it } from 'vitest'
import { filterExperiencesByField } from '@/features/experience/filter'
import { experienceToFormValues, EMPTY_EXPERIENCE } from '@/features/experience/ExperienceDialog'
import type { Experience } from '@/types/entities'

const makeExp = (field: 'software' | 'elv'): Experience => {
  return {
    id: 'e1',
    company: 'Co',
    title: 'Dev',
    description: null,
    location: null,
    employmentType: null,
    startDate: '2024-01-01',
    endDate: null,
    isCurrent: true,
    sortOrder: 0,
    isPublished: true,
    createdAt: '2026-10-06T14:41:38Z',
    updatedAt: '2026-10-06T14:41:38Z',
    field,
  } as unknown as Experience
}

describe('experience field filter', () => {
  it('returns all when "all"', () => {
    const list = [makeExp('software'), makeExp('elv')]
    expect(filterExperiencesByField(list, 'all')).toHaveLength(2)
  })
  it('filters by field', () => {
    const list = [makeExp('software'), makeExp('elv')]
    expect(filterExperiencesByField(list, 'elv')).toHaveLength(1)
    expect(filterExperiencesByField(list, 'software')).toHaveLength(1)
  })
})

describe('experience form defaults', () => {
  it('sets EMPTY_EXPERIENCE.field to software', () => {
    expect(EMPTY_EXPERIENCE.field).toBe('software')
  })
  it('maps field from stored role', () => {
    const role = makeExp('elv')
    const vals = experienceToFormValues(role)
    expect(vals.field).toBe('elv')
  })
})
