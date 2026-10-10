import { STORAGE_BUCKETS, type StorageBucket } from '@/constants/storage'

/**
 * Narrows a stored bucket name to one the application knows about.
 *
 * `media.bucket` is `text` with a CHECK constraint listing both bucket names, and the
 * generated type reflects the column type rather than the constraint — so it arrives as
 * `string`. This turns it into a `StorageBucket`, which is what `mediaUrl` needs to build a
 * URL and what makes it impossible to pass an arbitrary bucket name by accident.
 *
 * The fallback is unreachable while the constraint exists. It returns the media bucket
 * rather than throwing so that a bucket added to the database without updating the app
 * degrades to a broken thumbnail rather than a blank page.
 */
export function toStorageBucket(value: string | null | undefined): StorageBucket {
  return value === STORAGE_BUCKETS.files ? STORAGE_BUCKETS.files : STORAGE_BUCKETS.media
}
