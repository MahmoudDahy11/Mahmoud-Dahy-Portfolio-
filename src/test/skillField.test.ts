import { describe, expect, it } from 'vitest'
import { categoriesForField, skillToFormValues } from '@/features/skills/SkillDialog'
import { skillCategoryToFormValues } from '@/features/skills/SkillCategoryDialog'
import { filterSkillsByField } from '@/features/skills'
import type { SkillCategory } from '@/types/entities'
import type { SkillWithCategory } from '@/services/skills'

/**
 * The Software / ELV assignment rules.
 *
 * These are the parts that decide what the admin form offers and what a new row defaults
 * to, and they are pure functions so they can be checked without rendering a dialog or
 * touching the database.
 */

const categories: SkillCategory[] = [
  { id: 'c1', name: 'Languages', slug: 'languages', field: 'software', sortOrder: 1, createdAt: '', updatedAt: '' },
  { id: 'c2', name: 'Security Systems', slug: 'security-systems', field: 'elv', sortOrder: 2, createdAt: '', updatedAt: '' },
]

const storedSkill: SkillWithCategory = {
  id: 's1',
  name: 'CCTV',
  field: 'elv',
  categoryId: 'c2',
  proficiency: 70,
  iconPath: null,
  sortOrder: 0,
  isPublished: true,
  createdAt: '',
  updatedAt: '',
  skillCategories: { id: 'c2', name: 'Security Systems', slug: 'security-systems', sortOrder: 2 },
}

describe('filterSkillsByField', () => {
  const mixed: SkillWithCategory[] = [
    { ...storedSkill, id: 's1', name: 'Flutter', field: 'software' },
    storedSkill,
  ]

  it('keeps every skill when the filter is "all"', () => {
    expect(filterSkillsByField(mixed, 'all')).toHaveLength(2)
  })

  it('keeps only the chosen field', () => {
    expect(filterSkillsByField(mixed, 'elv').map((skill) => skill.name)).toEqual(['CCTV'])
    expect(filterSkillsByField(mixed, 'software').map((skill) => skill.name)).toEqual(['Flutter'])
  })
})

describe('categoriesForField', () => {
  it('returns only the categories of the requested field', () => {
    expect(categoriesForField(categories, 'software').map((category) => category.id)).toEqual(['c1'])
    expect(categoriesForField(categories, 'elv').map((category) => category.id)).toEqual(['c2'])
  })

  it('returns nothing when the field has no categories yet', () => {
    expect(categoriesForField([], 'elv')).toEqual([])
  })
})

describe('skillToFormValues', () => {
  it('starts a new skill in the field currently being viewed', () => {
    // Creating while the ELV filter is active should not quietly save a Software skill.
    expect(skillToFormValues(null, 'elv').field).toBe('elv')
    expect(skillToFormValues(null, 'software').field).toBe('software')
  })

  it('keeps the stored field when editing, ignoring the active filter', () => {
    expect(skillToFormValues(storedSkill, 'software').field).toBe('elv')
    expect(skillToFormValues(storedSkill, 'software').categoryId).toBe('c2')
  })
})

describe('skillCategoryToFormValues', () => {
  it('starts a new category in the field currently being viewed', () => {
    expect(skillCategoryToFormValues(null, 'elv').field).toBe('elv')
  })

  it('keeps the stored field when editing', () => {
    const stored = categories[1] as SkillCategory
    expect(skillCategoryToFormValues(stored, 'software').field).toBe('elv')
  })
})
