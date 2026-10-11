import { describe, expect, it } from 'vitest'
import { toDatabaseRow, toEntity } from '@/services/base'
import { projectSchema } from '@/schemas/project'
import { projectToFormValues, EMPTY_PROJECT } from '@/features/projects/ProjectDialog'
import type { ProjectWithRelations } from '@/types/entities'

/**
 * The conversion layer between a form and Postgres.
 *
 * These are the two functions every admin write depends on, and both fail *silently* rather
 * than loudly. A key that is not renamed is not a type error at the call site — the
 * generated types are wide enough to accept it — it is a Postgres `column not found` error at
 * runtime, or worse, a success that stored nothing. So the rules are pinned here instead.
 */

describe('toDatabaseRow', () => {
  it('renames camelCase keys to the column names Postgres expects', () => {
    const row = toDatabaseRow<'projects'>({
      title: 'Example',
      coverImagePath: 'projects/example.png',
      isPublished: true,
      isFeatured: false,
    })

    expect(row).toEqual({
      title: 'Example',
      cover_image_path: 'projects/example.png',
      is_published: true,
      is_featured: false,
    })
  })

  it('renames keys inside nested objects, so no key is left unconverted', () => {
    const row = toDatabaseRow<'project_images'>({
      projectId: 'p1',
      altText: 'A screenshot',
    })

    expect(row).toEqual({ project_id: 'p1', alt_text: 'A screenshot' })
  })

  it('stores an empty optional string as NULL rather than as an empty string', () => {
    // An empty input means "no value". Storing '' would satisfy a length check while making
    // the public page render an empty heading, so the empty string never reaches the row.
    const row = toDatabaseRow<'projects'>({
      title: 'Example',
      coverImagePath: '',
      description: '   ',
    })

    expect(row.cover_image_path).toBeNull()
    expect(row.description).toBeNull()
  })

  it('omits keys that have no value, so a partial update leaves other columns alone', () => {
    // The form always holds every field of the section, but a service may send only part of
    // a row. A key present with `undefined` is dropped by the Supabase client, so it never
    // becomes a `SET column = null` that clears data the form never touched.
    const row = toDatabaseRow<'projects'>({ title: 'Example', coverImagePath: undefined })

    expect(row).toEqual({ title: 'Example' })
    expect('cover_image_path' in row).toBe(false)
  })
})

describe('toEntity, on a row with embedded relations', () => {
  it('renames the embedded table name and the keys inside it', () => {
    // This is the shape a joined select returns. If either level is missed, a card renders
    // with no technologies and no gallery, and nothing in the types catches it.
    const project = toEntity<'projects'>({
      id: 'p1',
      title: 'Example',
      project_images: [{ id: 'i1', path: 'projects/a.png', alt_text: 'A screenshot' }],
      project_technologies: [{ technology: { id: 't1', name: 'Flutter', icon_path: 'flutter.svg' } }],
    } as never) as unknown as {
      projectImages: { altText: string }[]
      projectTechnologies: { technology: { iconPath: string } | null }[]
    }

    expect(project.projectImages[0]?.altText).toBe('A screenshot')
    expect(project.projectTechnologies[0]?.technology?.iconPath).toBe('flutter.svg')
  })
})

describe('projectToFormValues', () => {
  const stored = {
    title: 'Example',
    slug: 'example',
    coverImagePath: null,
    summary: null,
    description: null,
    repositoryUrl: null,
    liveUrl: null,
    role: null,
    clientName: null,
    startedAt: null,
    endedAt: null,
    isFeatured: false,
    isPublished: true,
    sortOrder: 3,
    field: 'software',
    images: [{ id: 'i1', path: 'projects/a.png', altText: 'A screenshot' }],
    technologies: [{ id: 't1', name: 'Flutter', slug: 'flutter' }],
  } as unknown as ProjectWithRelations

  it('turns a stored NULL into an empty input value', () => {
    // Passing null to <input value> renders the literal text "null" in the field.
    const values = projectToFormValues(stored)

    expect(values.coverImagePath).toBe('')
    expect(values.summary).toBe('')
    expect(values.repositoryUrl).toBe('')
  })

  it('flattens the relations into the ids and paths the form edits', () => {
    const values = projectToFormValues(stored)

    expect(values.technologyIds).toEqual(['t1'])
    expect(values.gallery).toEqual([{ path: 'projects/a.png', altText: 'A screenshot' }])
  })

  it('produces a form the schema accepts', () => {
    // The round trip is what matters: a stored row must be editable without the owner
    // having to retype it, so the converted values have to pass the same validation a fresh
    // form does.
    expect(projectSchema.safeParse(projectToFormValues(stored)).success).toBe(true)
  })
})

describe('projectSchema', () => {
  it('rejects a gallery row with no file behind it', () => {
    // The gallery editor can add a blank row before a file is chosen. Without this rule the
    // save would reach Postgres and fail on a NOT NULL path, with a message that does not
    // say which image is the problem.
    const result = projectSchema.safeParse({ ...EMPTY_PROJECT, title: 'Example', slug: 'example', gallery: [{ path: '', altText: 'A screenshot' }] })

    expect(result.success).toBe(false)
  })

  it('accepts a gallery image with no alt text and trims a blank one to empty', () => {
    // The description is optional: it is stored as NULL, which the service does by sending
    // the empty string the form produces. What must not survive is whitespace, because the
    // column's CHECK rejects a description that is present but blank.
    const result = projectSchema.safeParse({
      ...EMPTY_PROJECT,
      title: 'Example',
      slug: 'example',
      gallery: [{ path: 'projects/a.png', altText: '   ' }],
    })

    expect(result.success).toBe(true)
    expect(result.success && result.data.gallery[0]?.altText).toBe('')
  })

  it('accepts a project with no gallery and no technologies', () => {
    expect(projectSchema.safeParse({ ...EMPTY_PROJECT, title: 'Example', slug: 'example' }).success).toBe(true)
  })

  it('rejects a slug that is not URL-safe', () => {
    expect(projectSchema.safeParse({ ...EMPTY_PROJECT, title: 'Example', slug: 'Not A Slug' }).success).toBe(false)
  })
})
