import { fetchJoined, fetchOneOrThrow, fetchRows, getSupabaseClient, toDatabaseRow } from './base'
import { toFieldOption } from '@/utils/toFieldOption'
import type { Insert } from './base'
import type { Project, ProjectImage, ProjectWithRelations, Technology } from '@/types/entities'
import type { Row } from '@/types/entities'
import type { ProjectValues } from '@/schemas/project'

/**
 * Projects, for the grid and the detail page.
 *
 * The two relations a card needs — gallery images and the technologies used — are
 * embedded in the same query. Doing it here rather than in a component is what keeps the
 * page free of both a second request and a client-side join, and it means the N+1 problem
 * never exists rather than being avoided.
 *
 * Only published projects are selected. Row Level Security already hides drafts from the
 * public, so this filter is redundant for security; it is here because a redundant filter
 * costs nothing and a wrong one is a bug that only shows up in production.
 */

/** The select string describing a project with its relations resolved. */
const PROJECT_WITH_RELATIONS =
  '*, project_images(id, path, alt_text, sort_order), project_technologies(technology:technologies(id, name, slug, icon_path, sort_order))'

/**
 * A project row as PostgREST returns it, after `fetchJoined`'s recursive key rename.
 *
 * Embedded relations arrive under their table names, renamed to camelCase like every other
 * key: `project_technologies` becomes `projectTechnologies`, one level deep, and the nested
 * `alt_text`/`sort_order` arrive as `altText`/`sortOrder`. Declaring that shape explicitly
 * is what keeps the conversion honest instead of a cast — and it is what the live tests
 * assert, because a snake_case key here type-checks perfectly well and resolves to
 * `undefined` at runtime, leaving every project with an empty gallery and no technologies.
 */
type ProjectRow = Row<'projects'> & {
  projectImages: ProjectImage[]
  projectTechnologies: { technology: Technology | null }[]
}

function toProjectWithRelations(row: ProjectRow): ProjectWithRelations {
  const { projectImages, projectTechnologies, ...project } = row

  return {
    ...project,
    field: toFieldOption(project.field),
    images: projectImages ?? [],
    // A link row whose technology is missing is a referential-integrity problem the
    // database should not permit; skipping it keeps a card rendering instead of crashing.
    technologies: (projectTechnologies ?? [])
      .map((link) => link.technology)
      .filter((technology): technology is Technology => technology !== null),
  }
}

function toProjectList(rows: ProjectRow[]): ProjectWithRelations[] {
  return rows.map(toProjectWithRelations)
}

function toProject(row: Row<'projects'>): Project {
  return { ...row, field: toFieldOption(row.field) }
}

/**
 * Published projects, newest first by start date.
 *
 * `sort_order` is the owner's manual ordering, so it leads; the start date breaks ties
 * between rows the owner never reordered.
 */
export async function getPublishedProjects(options?: {
  featuredOnly?: boolean
  limit?: number
}): Promise<ProjectWithRelations[]> {
  let query = getSupabaseClient()
    .from('projects')
    .select(PROJECT_WITH_RELATIONS)
    .eq('is_published', true)

  if (options?.featuredOnly) {
    query = query.eq('is_featured', true)
  }

  if (options?.limit !== undefined) {
    query = query.limit(options.limit)
  }

  const rows = await fetchJoined<ProjectRow>(
    () =>
      query
        .order('sort_order', { ascending: true })
        .order('started_at', { ascending: false, nullsFirst: false }),
    'Could not load the projects.',
  )

  return toProjectList(rows)
}

/**
 * One project by slug, with the same relations resolved.
 *
 * Returns `null` for a slug that does not exist *and* for a draft, because the public
 * must not be able to tell those two apart. The page turns `null` into a 404.
 */
export async function getProjectBySlug(slug: string): Promise<ProjectWithRelations | null> {
  const rows = await fetchJoined<ProjectRow>(
    () =>
      getSupabaseClient()
        .from('projects')
        .select(PROJECT_WITH_RELATIONS)
        .eq('is_published', true)
        .eq('slug', slug)
        .limit(1),
    'Could not load the project.',
  )

  const row = rows[0]
  return row ? toProjectWithRelations(row) : null
}

/** The technology catalogue, for the project filter. */
export async function getTechnologies(): Promise<Technology[]> {
  return fetchRows<'technologies'>(
    () =>
      getSupabaseClient()
        .from('technologies')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true }),
    'Could not load the technologies.',
  )
}

export type TechnologyFilter = { slug: string; name: string; count: number }

/**
 * The technologies a visitor can filter by, with the number of published projects using
 * each one.
 *
 * The count is derived here rather than in the page. PostgREST can filter on an embedded
 * relation, but it cannot aggregate across a join, so either the count is computed in
 * JavaScript or the schema gains a denormalised column that can drift out of date. For a
 * list of a few dozen projects, computing it in the service is the simpler choice.
 */
export async function getTechnologyFilters(): Promise<TechnologyFilter[]> {
  const projects = await getPublishedProjects()

  const counts = new Map<string, TechnologyFilter>()

  for (const project of projects) {
    for (const technology of project.technologies) {
      const existing = counts.get(technology.slug)

      if (existing) {
        existing.count += 1
      } else {
        counts.set(technology.slug, { slug: technology.slug, name: technology.name, count: 1 })
      }
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/* ---------------------------------------------------------------------------
 * Admin operations
 *
 * A project is the one record that owns other records, so saving it is three writes rather
 * than one: the project row, its technology links, and its gallery. They are driven from a
 * single form submission by the functions below, which is what makes the dashboard's
 * "Save" button mean the same thing everywhere.
 * ------------------------------------------------------------------------ */

/**
 * Every project, drafts included, for the admin table.
 *
 * Deliberately not filtered: the whole point of a draft is that the owner can see it while
 * it is still being written. Row Level Security decides who may call this at all, so the
 * filter that matters is on the public side.
 */
export async function getAllProjects(): Promise<ProjectWithRelations[]> {
  const rows = await fetchJoined<ProjectRow>(
    () =>
      getSupabaseClient()
        .from('projects')
        .select(PROJECT_WITH_RELATIONS)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
    'Could not load the projects.',
  )

  return toProjectList(rows)
}

/**
 * The project's own columns, taken from the form values.
 *
 * The form also carries `technologyIds` and `gallery`, which belong to other tables.
 * Listing the columns explicitly means a new form field cannot be written to the project
 * row by accident, and it keeps the `technologyIds` key — which is not a column — from ever
 * reaching PostgREST.
 */
function projectColumns(values: ProjectValues): Insert<'projects'> {
  const { technologyIds: _technologies, gallery: _gallery, ...columns } = values
  return columns
}

/** Adds the technologies a project uses, and removes the ones it no longer does. */
async function syncTechnologies(projectId: string, technologyIds: string[]): Promise<void> {
  const client = getSupabaseClient()

  // Added first, removed second. The reverse order would leave a window in which the
  // project shows fewer technologies than it should if the second write failed; this way
  // the failure mode is a moment with one technology too many, which is far less visible.
  if (technologyIds.length > 0) {
    await fetchRows<'project_technologies'>(
      () =>
        client
          .from('project_technologies')
          .upsert(
            technologyIds.map((technologyId) => ({ project_id: projectId, technology_id: technologyId })),
            { onConflict: 'project_id,technology_id', ignoreDuplicates: true },
          )
          .select(),
      'Could not add the technologies to the project.',
    )
  }

  await fetchRows<'project_technologies'>(
    () => {
      const query = client.from('project_technologies').delete().eq('project_id', projectId)

      // PostgREST cannot express "not in an empty list", so an empty selection is simply
      // "delete them all".
      return technologyIds.length > 0
        ? query.not('technology_id', 'in', `(${technologyIds.join(',')})`).select()
        : query.select()
    },
    'Could not update the technologies on the project.',
  )
}

/**
 * What a description is stored as.
 *
 * The form holds `''` for an image the owner left undescribed; the column holds NULL for
 * the same thing, because `project_images_alt_check` still rejects a description that is
 * present but blank.
 */
function storedAltText(altText: string | undefined | null): string | null {
  return altText?.trim() || null
}

/**
 * Reconciles the gallery with the images in the form.
 *
 * Matched on the Storage path rather than the row id, because the path is what the form
 * actually holds: an image the owner did not touch keeps its path, so it is updated in place
 * instead of being deleted and re-added.
 *
 * The read-then-branch structure is required rather than an optimisation. There is no
 * unique constraint on `(project_id, path)`, so inserting the whole gallery on every save
 * would leave a duplicate row behind each time a project was edited — and the duplicate
 * would be invisible in the form, because the form only ever holds one entry for the path.
 * Updating what exists, inserting what is new, and deleting what was dropped is the only
 * order that leaves the table matching the form exactly.
 */
async function syncGallery(projectId: string, gallery: ProjectValues['gallery']): Promise<void> {
  const client = getSupabaseClient()

  const existing = await fetchRows<'project_images'>(
    () =>
      client
        .from('project_images')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true }),
    'Could not load the images on the project.',
  )

  const existingByPath = new Map(existing.map((image) => [image.path, image]))

  const newImages = gallery.filter((image) => !existingByPath.has(image.path))
  const droppedIds = existing
    .filter((image) => !gallery.some((entry) => entry.path === image.path))
    .map((image) => image.id)

  // Alt text and position are written per row rather than in one statement, because only the
  // rows that actually changed need a round trip. The service is not doing this for speed;
  // it is doing it because an unconditional bulk write would be a fourth write that can fail
  // for no reason on a project whose gallery did not change.
  for (const [index, image] of gallery.entries()) {
    const current = existingByPath.get(image.path)

    // The form holds '' for a description the owner left blank and the column holds NULL,
    // so both sides are normalised before they are compared — otherwise every save would
    // rewrite a row that has not changed.
    if (!current || ((current.altText ?? '') === (image.altText ?? '') && current.sortOrder === index)) {
      continue
    }

    await fetchRows<'project_images'>(
      () =>
        client
          .from('project_images')
          .update({ alt_text: storedAltText(image.altText), sort_order: index })
          .eq('id', current.id)
          .select(),
      'Could not update an image on the project.',
    )
  }

  if (newImages.length > 0) {
    await fetchRows<'project_images'>(
      () =>
        client
          .from('project_images')
          .insert(
            newImages.map((image) => ({
              project_id: projectId,
              path: image.path,
              alt_text: storedAltText(image.altText),
              // The image's position in the form, not its position among the new ones, so
              // adding an image in the middle of the list does not send it to the end.
              sort_order: gallery.findIndex((entry) => entry.path === image.path),
            })),
          )
          .select(),
      'Could not add the images to the project.',
    )
  }

  if (droppedIds.length > 0) {
    await fetchRows<'project_images'>(
      () => client.from('project_images').delete().in('id', droppedIds).select(),
      'Could not remove an image from the project.',
    )
  }
}

/** Creates a project with its technologies and gallery. */
export async function createProject(values: ProjectValues): Promise<Project> {
  const client = getSupabaseClient()

  const project = await fetchOneOrThrow<'projects'>(
    () =>
      client
        .from('projects')
        .insert(toDatabaseRow<'projects'>(projectColumns(values)))
        .select()
        .limit(1),
    'Could not save the project.',
  )

  await syncTechnologies(project.id, values.technologyIds)
  await syncGallery(project.id, values.gallery)

  return toProject(project)
}

/** Updates a project with its technologies and gallery. */
export async function updateProject(id: string, values: ProjectValues): Promise<Project> {
  const client = getSupabaseClient()

  const project = await fetchOneOrThrow<'projects'>(
    () =>
      client
        .from('projects')
        .update(toDatabaseRow<'projects'>(projectColumns(values)))
        .eq('id', id)
        .select()
        .limit(1),
    'Could not save the project.',
  )

  await syncTechnologies(id, values.technologyIds)
  await syncGallery(id, values.gallery)

  return toProject(project)
}

/**
 * Deletes a project.
 *
 * The gallery and technology links go with it: both tables have `on delete cascade`, so
 * one statement is enough and there are no orphans to clean up by hand. Files already
 * uploaded to Storage are not removed, because another record may reference the same
 * object; the media library is where an unused file is deleted.
 */
export async function deleteProject(id: string): Promise<void> {
  await fetchRows<'projects'>(
    () => getSupabaseClient().from('projects').delete().eq('id', id).select(),
    'Could not delete the project.',
  )
}
