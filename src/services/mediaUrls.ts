import { STORAGE_BUCKETS, type StorageBucket } from '@/constants/storage'
import { getSupabaseClient } from '@/lib/supabase'

/**
 * Public URLs for files in Supabase Storage.
 *
 * Both buckets are configured public-read, so an object's URL is a plain, permanent
 * address that can be put straight into an `<img src>` or an Open Graph tag. That is
 * deliberate: a signed URL would expire, which breaks social previews and makes any
 * cached copy of a page point at nothing.
 *
 * These are the same paths the database stores, so nothing in the content tables holds a
 * full URL. That matters because the Supabase project URL is deployment configuration —
 * storing it in a row would make changing projects a data migration.
 */

/** Returns the public URL for a stored path, or `null` when there is no path. */
export function mediaUrl(path: string | null | undefined, bucket: StorageBucket = STORAGE_BUCKETS.media) {
  if (!path) return null

  return getSupabaseClient().storage.from(bucket).getPublicUrl(path).data.publicUrl
}

/** Convenience for images, which live in the media bucket. */
export function imageUrl(path: string | null | undefined) {
  return mediaUrl(path, STORAGE_BUCKETS.media)
}

/** Convenience for documents such as the resume, which live in the files bucket. */
export function fileUrl(path: string | null | undefined) {
  return mediaUrl(path, STORAGE_BUCKETS.files)
}
