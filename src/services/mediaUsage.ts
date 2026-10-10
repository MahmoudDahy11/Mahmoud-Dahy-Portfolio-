import { STORAGE_BUCKETS, type StorageBucket } from '@/constants/storage'
import { ADMIN_ROUTES, type AdminRoute } from '@/constants/routes'
import { fetchJoined, getSupabaseClient } from './base'

/**
 * Which records point at each stored file.
 *
 * The media library can delete a file from the bucket, and doing that to a file a project
 * still uses produces a broken image on the public site with nothing in the console to
 * explain it. Listing every place a file is referenced turns that into an informed choice.
 *
 * The references are read from the content tables, not from `media`, because `media` does
 * not know who uses a file: the link is one-directional — an entity stores the path, and
 * `media` records what was uploaded. That means a file can exist in the library with no
 * owner, and this is the only way to find out.
 *
 * One consequence worth stating: a file referenced by a *draft* row counts as used. The
 * draft is invisible to visitors today, but it is not an orphan, and deleting its image
 * would silently break it the moment the owner published.
 */

/** A place a stored path is used, and the admin section that owns it. */
export type MediaReference = {
  /** Human description, e.g. `Project cover: Clinic Booking`. */
  label: string
  /** The admin section to edit it in, taken from the route constants. */
  section: AdminRoute
}

/**
 * The map key for a stored object.
 *
 * The bucket is part of the key because two buckets can hold the same path, and a
 * `misc/logo.png` in each would be two different files. A path alone would merge them.
 */
export function mediaUsageKey(bucket: StorageBucket, path: string): string {
  return `${bucket}::${path}`
}

/** A path and its human description, from one content row. */
type PathRow = { path: string; label: string }

/** The references held by one admin section, all in a single bucket. */
type UsageSource = {
  bucket: StorageBucket
  section: AdminRoute
  rows: PathRow[]
}

/**
 * Reads every content column that stores a storage path.
 *
 * Each query is written out rather than driven from a table name, because the columns and
 * the label differ on every table and the Supabase client types `.from()` against a union
 * of real table names — a generic loop over a `string` table name does not type-check.
 * This mirrors `adminOverview.ts`, which spells its counts out for the same reason.
 *
 * `not('...', 'is', null)` keeps rows with no path out of the result at the database rather
 * than filtering empty strings in the browser.
 */
async function readUsageSources(): Promise<UsageSource[]> {
  const client = getSupabaseClient()

  const [
    profile,
    about,
    skills,
    technologies,
    projects,
    projectImages,
    educations,
    certificates,
    services,
    socialLinks,
    settings,
  ] = await Promise.all([
    fetchJoined<{ avatarPath: string | null; coverPath: string | null; resumePath: string | null }>(
      () => client.from('profile').select('avatar_path, cover_path, resume_path').limit(1),
      'Could not read profile media references.',
    ),
    fetchJoined<{ imagePath: string | null; title: string }>(
      () => client.from('about_sections').select('image_path, title').not('image_path', 'is', null),
      'Could not read about media references.',
    ),
    fetchJoined<{ iconPath: string | null; name: string }>(
      () => client.from('skills').select('icon_path, name').not('icon_path', 'is', null),
      'Could not read skill media references.',
    ),
    fetchJoined<{ iconPath: string | null; name: string }>(
      () => client.from('technologies').select('icon_path, name').not('icon_path', 'is', null),
      'Could not read technology media references.',
    ),
    fetchJoined<{ coverImagePath: string | null; title: string }>(
      () =>
        client
          .from('projects')
          .select('cover_image_path, title')
          .not('cover_image_path', 'is', null),
      'Could not read project media references.',
    ),
    fetchJoined<{ path: string; projects: { title: string } | null }>(
      () => client.from('project_images').select('path, projects(title)'),
      'Could not read project gallery media references.',
    ),
    fetchJoined<{ logoPath: string | null; institution: string }>(
      () => client.from('educations').select('logo_path, institution').not('logo_path', 'is', null),
      'Could not read education media references.',
    ),
    fetchJoined<{ imagePath: string | null; title: string }>(
      () => client.from('certificates').select('image_path, title').not('image_path', 'is', null),
      'Could not read certificate media references.',
    ),
    fetchJoined<{ iconPath: string | null; title: string }>(
      () => client.from('services').select('icon_path, title').not('icon_path', 'is', null),
      'Could not read service media references.',
    ),
    fetchJoined<{ iconPath: string | null; label: string }>(
      () => client.from('social_links').select('icon_path, label').not('icon_path', 'is', null),
      'Could not read social link media references.',
    ),
    fetchJoined<{ ogImagePath: string | null }>(
      () => client.from('site_settings').select('og_image_path').limit(1),
      'Could not read site settings media references.',
    ),
  ])

  const singles = profile[0] ?? { avatarPath: null, coverPath: null, resumePath: null }
  const media = STORAGE_BUCKETS.media

  return [
    {
      bucket: media,
      section: ADMIN_ROUTES.profile,
      rows: nonEmpty([
        { path: singles.avatarPath, label: 'Profile avatar' },
        { path: singles.coverPath, label: 'Profile cover image' },
      ]),
    },
    {
      bucket: media,
      section: ADMIN_ROUTES.about,
      rows: nonEmpty(about.map((row) => ({ path: row.imagePath, label: `About: ${row.title}` }))),
    },
    {
      bucket: media,
      section: ADMIN_ROUTES.skills,
      rows: nonEmpty(skills.map((row) => ({ path: row.iconPath, label: `Skill: ${row.name}` }))),
    },
    {
      bucket: media,
      section: ADMIN_ROUTES.skills,
      rows: nonEmpty(
        technologies.map((row) => ({ path: row.iconPath, label: `Technology: ${row.name}` })),
      ),
    },
    {
      bucket: media,
      section: ADMIN_ROUTES.projects,
      rows: nonEmpty(
        projects.map((row) => ({
          path: row.coverImagePath,
          label: `Project cover: ${row.title}`,
        })),
      ),
    },
    {
      bucket: media,
      section: ADMIN_ROUTES.projects,
      rows: projectImages.map((row) => ({
        path: row.path,
        label: `Project gallery: ${row.projects?.title ?? 'unknown project'}`,
      })),
    },
    {
      bucket: media,
      section: ADMIN_ROUTES.education,
      rows: nonEmpty(
        educations.map((row) => ({ path: row.logoPath, label: `Education: ${row.institution}` })),
      ),
    },
    {
      bucket: media,
      section: ADMIN_ROUTES.certificates,
      rows: nonEmpty(
        certificates.map((row) => ({ path: row.imagePath, label: `Certificate: ${row.title}` })),
      ),
    },
    {
      bucket: media,
      section: ADMIN_ROUTES.services,
      rows: nonEmpty(
        services.map((row) => ({ path: row.iconPath, label: `Service: ${row.title}` })),
      ),
    },
    {
      bucket: media,
      section: ADMIN_ROUTES.socialLinks,
      rows: nonEmpty(
        socialLinks.map((row) => ({ path: row.iconPath, label: `Social link: ${row.label}` })),
      ),
    },
    // The résumé is the one reference that lives in the files bucket.
    {
      bucket: STORAGE_BUCKETS.files,
      section: ADMIN_ROUTES.profile,
      rows: nonEmpty([{ path: singles.resumePath, label: 'Profile résumé' }]),
    },
    {
      bucket: media,
      section: ADMIN_ROUTES.settings,
      rows: nonEmpty([
        { path: settings[0]?.ogImagePath ?? null, label: 'Site social share image' },
      ]),
    },
  ]
}

/** Drops rows whose path is null, narrowing the type, without a cast in the caller. */
function nonEmpty(rows: Array<{ path: string | null; label: string }>): PathRow[] {
  return rows.filter((row): row is PathRow => Boolean(row.path))
}

/**
 * Groups every reference by the object it points at.
 *
 * The result is keyed by `mediaUsageKey`, so a caller holding an asset asks
 * `usage.get(mediaUsageKey(asset.bucket, asset.path))` and gets an empty array when nothing
 * uses it.
 */
export async function getMediaUsage(): Promise<Map<string, MediaReference[]>> {
  const usage = new Map<string, MediaReference[]>()
  const sources = await readUsageSources()

  for (const source of sources) {
    for (const row of source.rows) {
      const key = mediaUsageKey(source.bucket, row.path)
      const reference: MediaReference = { label: row.label, section: source.section }
      const existing = usage.get(key)

      if (existing) {
        existing.push(reference)
      } else {
        usage.set(key, [reference])
      }
    }
  }

  return usage
}
