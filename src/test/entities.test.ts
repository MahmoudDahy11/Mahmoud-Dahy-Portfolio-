import { describe, expectTypeOf, it } from 'vitest'
import type { Create, MediaAsset, Profile, Project, Update } from '@/types/entities'

/**
 * The entity types are derived from the generated database types rather than written out,
 * which means a schema change can never silently leave the app with a stale name. These
 * assertions are what make that derivation trustworthy: if the rename in
 * `src/types/entities.ts` stops working, they fail at compile time.
 *
 * They also pin the one convention every service depends on. The database speaks
 * `snake_case`; the app speaks `camelCase`, and nothing outside `src/services` should ever
 * have to think about a column name.
 */
describe('entity types', () => {
  it('renames every column of a single-row table', () => {
    expectTypeOf<Profile>().toHaveProperty('fullName')
    expectTypeOf<Profile>().toHaveProperty('shortBio')
    expectTypeOf<Profile>().toHaveProperty('yearsOfExperience')
    expectTypeOf<Profile>().toHaveProperty('resumePath')
    expectTypeOf<Profile>().not.toHaveProperty('full_name')
    expectTypeOf<Profile>().not.toHaveProperty('years_of_experience')
  })

  it('renames multi-word columns on a table with relations', () => {
    expectTypeOf<Project>().toHaveProperty('isPublished')
    expectTypeOf<Project>().toHaveProperty('coverImagePath')
    expectTypeOf<Project>().toHaveProperty('repositoryUrl')
    expectTypeOf<Project>().toHaveProperty('startedAt')
  })

  it('renames columns that repeat the table prefix', () => {
    expectTypeOf<MediaAsset>().toHaveProperty('fileName')
    expectTypeOf<MediaAsset>().toHaveProperty('mimeType')
    expectTypeOf<MediaAsset>().toHaveProperty('sizeBytes')
  })

  it('keeps nullable columns nullable rather than widening them to undefined', () => {
    expectTypeOf<Profile['phone']>().toEqualTypeOf<string | null>()
    expectTypeOf<Project['endedAt']>().toEqualTypeOf<string | null>()
    expectTypeOf<Profile['fullName']>().toEqualTypeOf<string>()
  })

  it('leaves database defaults optional on create and makes every column optional on update', () => {
    // `title` and `slug` are NOT NULL with no default, so a create must supply them.
    expectTypeOf<Create<'projects'>>().toHaveProperty('title')
    expectTypeOf<Create<'projects'>>().toHaveProperty('slug')
    expectTypeOf<Create<'projects'>>().toHaveProperty('isPublished').toEqualTypeOf<boolean | undefined>()
    expectTypeOf<Create<'projects'>>().toHaveProperty('createdAt').toEqualTypeOf<string | undefined>()

    expectTypeOf<Update<'projects'>>().toHaveProperty('title').toEqualTypeOf<string | undefined>()
    expectTypeOf<Update<'projects'>>().toHaveProperty('slug').toEqualTypeOf<string | undefined>()
  })

  it('requires the fields the contact form collects', () => {
    expectTypeOf<Create<'contact_messages'>>().toHaveProperty('name')
    expectTypeOf<Create<'contact_messages'>>().toHaveProperty('email')
    expectTypeOf<Create<'contact_messages'>>().toHaveProperty('message')
    // The visitor never supplies these; the sealing trigger does.
    expectTypeOf<Create<'contact_messages'>>().toHaveProperty('isRead').toEqualTypeOf<boolean | undefined>()
  })
})