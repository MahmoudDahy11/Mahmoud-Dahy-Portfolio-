import { STORAGE_BUCKETS, type StorageBucket } from '@/constants/storage'
import { AppError } from '@/lib/errors'
import { fetchJoined, getSupabaseClient, runQuery } from './base'
import { getMediaUsage, mediaUsageKey } from './mediaUsage'

/**
 * Objects that exist in Storage but are not recorded in the `media` table.
 *
 * The media library can only show what has a row, so a file whose `media` insert failed —
 * or that was placed in a bucket outside the dashboard — is invisible and can never be
 * cleaned up from the UI. This is the one read that looks at the bucket itself rather than
 * at the table, and it is what closes that gap.
 *
 * An object is only reported when *nothing* knows about it: not a `media` row, and not a
 * content row that stores its path. A content reference with no `media` row is unusual but
 * possible (a path typed by hand), and deleting it would break the public page it appears
 * on. Those are left alone.
 *
 * The buckets are public-read, so the Storage list call needs no special privilege. The
 * *delete* it enables is admin-only, enforced by `storage.objects` policies.
 */

/** A file found in a bucket with no record anywhere in the database. */
export type UnrecordedObject = {
  bucket: StorageBucket
  path: string
  sizeBytes: number | null
  mimeType: string | null
}

/** The Storage list response entry, narrowed to the fields this service uses. */
type StorageListEntry = {
  name: string
  id: string | null
  metadata: { size?: number; mimetype?: string } | null
}

/**
 * A guard against a pathological folder tree.
 *
 * Uploads are always `folder/file`, one level deep, so three is generous. Without a cap a
 * bucket with a cycle or an unexpectedly deep tree would recurse until the tab died.
 */
const MAX_DEPTH = 3

/** Lists one folder, recursing into subfolders, and returns full object paths. */
async function listFolder(
  bucket: StorageBucket,
  prefix: string,
  depth: number,
): Promise<UnrecordedObject[]> {
  if (depth > MAX_DEPTH) return []

  const { data, error } = await getSupabaseClient()
    .storage.from(bucket)
    .list(prefix, { limit: 1000 })

  if (error) {
    throw new AppError(`Could not list the ${bucket} bucket.`, error)
  }

  const found: UnrecordedObject[] = []

  for (const entry of (data ?? []) as StorageListEntry[]) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name

    if (entry.id === null) {
      found.push(...(await listFolder(bucket, path, depth + 1)))
      continue
    }

    found.push({
      bucket,
      path,
      sizeBytes: entry.metadata?.size ?? null,
      mimeType: entry.metadata?.mimetype ?? null,
    })
  }

  return found
}

/** Every object key already accounted for by a `media` row. */
async function getRecordedKeys(): Promise<Set<string>> {
  const rows = await fetchJoined<{ bucket: string; path: string }>(
    () => getSupabaseClient().from('media').select('bucket, path'),
    'Could not read the media records.',
  )

  return new Set(rows.map((row) => mediaUsageKey(row.bucket as StorageBucket, row.path)))
}

/**
 * Everything in either bucket that no row and no content reference points at.
 *
 * Reads the three sources in parallel: the bucket listing, the `media` records, and the
 * content references. The reference map is reused from `getMediaUsage`, so the definition of
 * "in use" is the same one the library displays.
 */
export async function getUnrecordedObjects(): Promise<UnrecordedObject[]> {
  const buckets = [STORAGE_BUCKETS.media, STORAGE_BUCKETS.files] as const

  const [objects, recorded, usage] = await Promise.all([
    Promise.all(buckets.map((bucket) => listFolder(bucket, '', 0))).then((lists) => lists.flat()),
    getRecordedKeys(),
    getMediaUsage(),
  ])

  const accountedFor = new Set<string>([...recorded, ...usage.keys()])

  return objects.filter((object) => !accountedFor.has(mediaUsageKey(object.bucket, object.path)))
}

/** Removes one unrecorded object from its bucket. */
export async function deleteUnrecordedObject(
  object: Pick<UnrecordedObject, 'bucket' | 'path'>,
): Promise<void> {
  await runQuery<unknown>(
    () => getSupabaseClient().storage.from(object.bucket).remove([object.path]),
    `Could not remove ${object.path} from storage.`,
  )
}
