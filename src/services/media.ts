import {
  FILE_MAX_SIZE_BYTES,
  FILE_MIME_TYPES,
  IMAGE_MAX_SIZE_BYTES,
  IMAGE_MIME_TYPES,
  STORAGE_BUCKETS,
  STORAGE_FOLDERS,
  type StorageBucket,
} from '@/constants/storage'
import { AppError } from '@/lib/errors'
import { toStorageBucket } from '@/utils/toStorageBucket'
import { fetchRows, getSupabaseClient, runQuery, toDatabaseRow } from './base'
import type { Insert, Patch } from './base'
import type { MediaAsset } from '@/types/entities'

/**
 * Uploading to Supabase Storage and recording what was uploaded.
 *
 * A file on its own is not portfolio content. The database row is what the rest of the app
 * reads: the media library, the alt text an image needs, and the record of who put it
 * there. So an upload is always two operations — store the object, then record it — and
 * the order matters. Storing the object first means a failed insert leaves an unreferenced
 * file, which is invisible and harmless; the reverse would leave a row pointing at a file
 * that does not exist and a broken image on the public site.
 *
 * Uploads are admin-only. That is enforced by policies on `storage.objects`, not by
 * anything in this file — a caller that bypasses the dashboard entirely still gets a
 * permission error from the database.
 */

/** How the caller describes what it is uploading. */
export type UploadRequest = {
  file: File
  /** Object key prefix, from `STORAGE_FOLDERS`, so the bucket stays navigable. */
  folder: string
  bucket?: StorageBucket
  altText?: string
}

/** Throws a readable `AppError` when the file is not something a bucket accepts. */
function assertAcceptable(file: File, bucket: StorageBucket) {
  const isImage = bucket === STORAGE_BUCKETS.media
  const allowedTypes: readonly string[] = isImage ? IMAGE_MIME_TYPES : FILE_MIME_TYPES
  const maxSize = isImage ? IMAGE_MAX_SIZE_BYTES : FILE_MAX_SIZE_BYTES

  if (!allowedTypes.includes(file.type)) {
    throw new AppError(`${file.name} is not an accepted file type for this bucket.`)
  }

  if (file.size <= 0 || file.size > maxSize) {
    throw new AppError(`${file.name} is larger than this bucket allows.`)
  }
}

/**
 * Builds the object key.
 *
 * The random suffix is what stops two uploads of `avatar.png` from overwriting each other,
 * and it is why an image can be replaced without the previous one briefly disappearing.
 * The readable prefix is kept so the bucket can still be navigated by a human.
 */
function buildPath(folder: string, file: File): string {
  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : 'bin'
  const stem = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  const unique = crypto.randomUUID().slice(0, 8)

  return `${folder}/${stem || 'file'}-${unique}.${extension || 'bin'}`
}

/**
 * Reads an image's natural size so the media library can show it before it is displayed.
 *
 * Purely informational — `width` and `height` are nullable — so a browser that cannot
 * decode the image simply records no dimensions rather than failing the upload.
 */
async function readImageSize(file: File): Promise<{ width: number | null; height: number | null }> {
  if (typeof createImageBitmap !== 'function') {
    return { width: null, height: null }
  }

  try {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    return { width: null, height: null }
  }
}

/** Uploads a file and records it in `media`, returning the stored record. */
export async function uploadMedia({
  file,
  folder,
  bucket = STORAGE_BUCKETS.media,
  altText,
}: UploadRequest): Promise<MediaAsset> {
  assertAcceptable(file, bucket)

  const path = buildPath(folder, file)
  const client = getSupabaseClient()

  // `getUser()` rather than `getSession()`: the session is a client-held JWT that could
  // have been tampered with, whereas this call asks the auth server who the caller is.
  const { data: userData } = await client.auth.getUser()
  const { width, height } = await readImageSize(file)

  await runQuery<null>(
    // `contentType` is set from the file itself rather than left on its default (a generic
    // `text/plain`). In a browser the client sends the file through FormData and this
    // option is ignored; outside a browser, where the raw body is sent, it is the only
    // thing standing between a valid upload and the bucket's "mime type not supported".
    () =>
      client.storage
        .from(bucket)
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type }),
    `Could not upload ${file.name}.`,
  )

  const record: Insert<'media'> = {
    bucket,
    path,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    width,
    height,
    altText: altText ?? null,
    createdBy: userData.user?.id ?? null,
  }

  const saved = (
    await fetchRows<'media'>(
      () => client.from('media').insert(toDatabaseRow<'media'>(record)).select(),
      `Could not record ${file.name} in the media library.`,
    )
  )[0]

  if (!saved) {
    throw new AppError('The upload finished but the file was not recorded. Please try again.')
  }

  return { ...saved, bucket: toStorageBucket(saved.bucket) }
}

/** Everything in the media library, newest first. */
export async function getMediaAssets(): Promise<MediaAsset[]> {
  const rows = await fetchRows<'media'>(
    () =>
      getSupabaseClient()
        .from('media')
        .select('*')
        .order('created_at', { ascending: false }),
    'Could not load the media library.',
  )

  return rows.map((row) => ({ ...row, bucket: toStorageBucket(row.bucket) }))
}

/** Updates the descriptive fields of a stored file. */
export async function updateMediaAsset(id: string, values: Patch<'media'>): Promise<MediaAsset | null> {
  const rows = await fetchRows<'media'>(
    () => getSupabaseClient().from('media').update(toDatabaseRow<'media'>(values)).eq('id', id).select(),
    'Could not update the file details.',
  )

  const row = rows[0]
  return row ? { ...row, bucket: toStorageBucket(row.bucket) } : null
}

/**
 * Removes a file from the bucket and deletes its record.
 *
 * The object goes first. A surviving row pointing at a deleted object would render a
 * broken image; a surviving object nobody references is only storage. When the object
 * cannot be removed the row is still deleted, so the library never shows an entry that
 * cannot be used.
 */
export async function deleteMediaAsset(asset: Pick<MediaAsset, 'id' | 'bucket' | 'path'>): Promise<void> {
  const client = getSupabaseClient()

  const { error } = await client.storage.from(asset.bucket).remove([asset.path])

  if (error) {
    console.error('[supabase] could not remove the stored object', error)
  }

  await runQuery(
    () => client.from('media').delete().eq('id', asset.id),
    'Could not delete the file record.',
  )
}

/** The folder a given kind of upload belongs in, so callers do not hardcode strings. */
export const MEDIA_FOLDERS = STORAGE_FOLDERS
