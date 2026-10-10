import { describe, expect, it } from 'vitest'
import { slugify } from '@/utils/slugify'

describe('slugify', () => {
  it('lowercases and hyphenates a title', () => {
    expect(slugify('My First Project')).toBe('my-first-project')
  })

  it('strips diacritics instead of dropping the letters', () => {
    expect(slugify('Café Manager')).toBe('cafe-manager')
  })

  it('collapses repeated separators and trims leading and trailing hyphens', () => {
    expect(slugify('  ---Hello___World!!!---  ')).toBe('hello-world')
  })

  it('caps the length at the column limit', () => {
    expect(slugify('a'.repeat(200))).toHaveLength(80)
  })

  it('returns an empty string when nothing usable remains', () => {
    expect(slugify('***')).toBe('')
  })
})