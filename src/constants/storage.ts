/**
 * Storage configuration, mirroring the bucket design in ARCHITECTURE.md section 8.
 * Values here are read by the media services; they are not duplicated in components.
 */

export const STORAGE_BUCKETS = {
  /** Images: avatars, project covers, galleries, certificates, logos, icons. */
  media: 'portfolio-media',
  /** Documents: resume and similar downloadable files. */
  files: 'portfolio-files',
} as const

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS]

/**
 * Object key prefixes inside the media bucket. Keeps the bucket navigable and allows
 * folder-scoped rules later without changing any code.
 */
export const STORAGE_FOLDERS = {
  profile: 'profile',
  projects: 'projects',
  certificates: 'certificates',
  experience: 'experience',
  education: 'education',
  technologies: 'technologies',
  misc: 'misc',
} as const

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const

export const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024
export const FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024
export const FILE_MIME_TYPES = ['application/pdf'] as const

export const ACCEPTED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.avif'
export const ACCEPTED_FILE_EXTENSIONS = '.pdf'
