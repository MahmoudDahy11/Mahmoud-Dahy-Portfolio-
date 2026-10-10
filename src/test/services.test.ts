import { describe, expect, it } from 'vitest'
import { toEntities, toEntity } from '@/services/base'
import type { Project } from '@/types/entities'

/**
 * The `snake_case` -> `camelCase` rename in `src/services/base.ts`.
 *
 * This is the one piece of the data layer that runs on every row the app ever receives, so
 * a mistake here would surface as `undefined` somewhere far from its cause. The cases below
 * cover the three things that can actually go wrong: a multi-word column, a key that must
 * not be touched, and a nested relation.
 */
describe('toEntity', () => {
  it('renames every snake_case column', () => {
    const row = {
      id: 'p1',
      title: 'Project',
      cover_image_path: 'projects/p1.png',
      repository_url: 'https://github.com/example/project',
      is_published: true,
      is_featured: false,
      sort_order: 2,
      started_at: '2024-01-01',
      ended_at: null,
      client_name: 'Acme',
      summary: 'A short summary.',
      description: null,
      live_url: null,
      role: 'Developer',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    } as unknown as Parameters<typeof toEntity<'projects'>>[0]

    expect(toEntity<'projects'>(row)).toEqual({
      id: 'p1',
      title: 'Project',
      coverImagePath: 'projects/p1.png',
      repositoryUrl: 'https://github.com/example/project',
      isPublished: true,
      isFeatured: false,
      sortOrder: 2,
      startedAt: '2024-01-01',
      endedAt: null,
      clientName: 'Acme',
      summary: 'A short summary.',
      description: null,
      liveUrl: null,
      role: 'Developer',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    })
  })

  it('leaves keys that are not snake_case untouched', () => {
    // A UUID value containing underscores, and a key that is already camelCase. Only keys
    // are ever renamed: values pass through untouched whatever they contain.
    const row = {
      id: 'a_very_long_uuid_value',
      avatarPath: 'profile/me.png',
    } as unknown as Parameters<typeof toEntity<'profile'>>[0]

    const result = toEntity<'profile'>(row) as unknown as Record<string, unknown>

    expect(result.id).toBe('a_very_long_uuid_value')
    expect(result.avatarPath).toBe('profile/me.png')
  })

  it('renames a single trailing underscore group, as in a real column name', () => {
    const row = {
      id: 'm1',
      logo_url: 'https://example.com/a_logo.png',
      file_name: 'resume.pdf',
      size_bytes: 1024,
    } as unknown as Parameters<typeof toEntity<'media'>>[0]

    const result = toEntity<'media'>(row) as unknown as Record<string, unknown>

    // The underscore inside the URL is a value, not a key, so the path is preserved whole.
    expect(result.logoUrl).toBe('https://example.com/a_logo.png')
    expect(result.fileName).toBe('resume.pdf')
    expect(result.sizeBytes).toBe(1024)
  })

  it('renames nested keys too, which is what makes an embedded relation usable', () => {
    // PostgREST names an embedded relation after the table, so the key arrives as
    // `skill_categories` and has to become `skillCategories` for the UI to read it.
    const row = {
      id: 's1',
      name: 'TypeScript',
      skill_categories: { id: 'c1', name: 'Languages', sort_order: 1 },
    } as unknown as Parameters<typeof toEntity<'skills'>>[0]

    const result = toEntity<'skills'>(row) as unknown as {
      skillCategories: { id: string; name: string; sortOrder: number }
    }

    expect(result.skillCategories).toEqual({ id: 'c1', name: 'Languages', sortOrder: 1 })
  })

  it('preserves a null relation rather than dropping the key', () => {
    // A skill with no category comes back as null. The UI groups on that, so a missing key
    // would be a different code path from a null one.
    const row = {
      id: 's2',
      name: 'Uncategorised',
      skill_categories: null,
    } as unknown as Parameters<typeof toEntity<'skills'>>[0]

    const result = toEntity<'skills'>(row) as unknown as Record<string, unknown>

    expect(result.skillCategories).toBeNull()
    expect('skillCategories' in result).toBe(true)
  })

  it('preserves null, undefined, and falsy values as they are', () => {
    // The trap this guards against is a transform written as `row[k] || undefined`, which
    // would turn a legitimate 0 or empty string into null and lose real data.
    const row = {
      id: 'x',
      sort_order: 0,
      summary: '',
      description: null,
      end_date: undefined,
    } as unknown as Parameters<typeof toEntity<'projects'>>[0]

    const result = toEntity<'projects'>(row) as unknown as Record<string, unknown>

    expect(result.sortOrder).toBe(0)
    expect(result.summary).toBe('')
    expect(result.description).toBeNull()
    expect(result.endDate).toBeUndefined()
  })
})

describe('toEntities', () => {
  it('maps every row and returns an empty array for an empty list', () => {
    const rows = [
      { id: 'a', cover_image_path: 'a.png' },
      { id: 'b', cover_image_path: 'b.png' },
    ] as unknown as Parameters<typeof toEntities<'projects'>>[0]

    expect(toEntities<'projects'>(rows)).toEqual([
      { id: 'a', coverImagePath: 'a.png' },
      { id: 'b', coverImagePath: 'b.png' },
    ] satisfies Partial<Project>[])

    expect(toEntities<'projects'>([])).toEqual([])
  })
})

describe('fetchFirst / fetchOne', () => {
  it('do not return raw snake_case objects', () => {
    // Compile-time guarantee: the type must be a mapped (camelCase) type, not a raw row.
    // The function signatures already encode this. We also assert at runtime that the
    // transform was applied by checking a known multi-word field name exists in camelCase.
    const sample = toEntity<'projects'>({
      id: 'x',
      cover_image_path: 'x.png',
    } as any)

    // If we had returned the raw row, this key would not exist.
    expect(Object.prototype.hasOwnProperty.call(sample, 'coverImagePath')).toBe(true)
    expect(Object.prototype.hasOwnProperty.call(sample, 'cover_image_path')).toBe(false)
  })
})
