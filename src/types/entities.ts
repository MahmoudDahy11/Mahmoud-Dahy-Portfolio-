/**
 * Application-facing types.
 *
 * Components and services refer to these names rather than to raw generated database row
 * types. The database uses `snake_case`; the app uses `camelCase`, and the rename happens
 * here so it happens exactly once.
 *
 * Why these are derived from `src/types/database.ts` instead of written out by hand: a
 * hand-written copy of 17 table shapes would silently drift from the real schema. The
 * rename below is mechanical and total, so deriving it means a schema change shows up as
 * a TypeScript error at the call site instead of as a wrong value at runtime.
 *
 * A hand-written type is still the right choice the moment a field needs to be *shaped*
 * rather than renamed — a computed `readTime`, a flattened join, a formatted date. Add
 * those as their own explicit types rather than bending this file.
 */
import type { Tables, TablesInsert, TablesUpdate } from './database'
import type { ThemeOption } from '@/constants/validation'
import type { FieldOption } from '@/constants/fields'
import type { StorageBucket } from '@/constants/storage'

/** Supabase returns dates as ISO strings; this names that fact explicitly. */
export type ISODateString = string

/**
 * `profile_table` -> `profileTable`. Recurses so multi-word keys convert fully, e.g.
 * `cover_image_path` -> `coverImagePath`.
 */
type CamelCase<Value extends string> = Value extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : Value

/** Same keys as `Source`, renamed to camelCase. Values are untouched. */
type CamelKeys<Source> = {
  [Key in keyof Source as Key extends string ? CamelCase<Key> : Key]: Source[Key]
}

/** Shared shape for every table that tracks publication state and ordering. */
export type Publishable = {
  isPublished: boolean
  sortOrder: number
}

export type Timestamped = {
  createdAt: ISODateString
  updatedAt: ISODateString
}

/** A row as it comes back from Supabase, with the column names renamed. */
export type Row<TableName extends TableNames> = CamelKeys<Tables<TableName>>

/** The values a form supplies when creating a row. Database defaults are already optional. */
export type Create<TableName extends TableNames> = CamelKeys<TablesInsert<TableName>>

/** The values a form supplies when editing a row. Every column is optional. */
export type Update<TableName extends TableNames> = CamelKeys<TablesUpdate<TableName>>

export type TableNames =
  | 'about_sections'
  | 'admin_users'
  | 'certificates'
  | 'contact_messages'
  | 'educations'
  | 'experiences'
  | 'media'
  | 'profile'
  | 'project_images'
  | 'project_technologies'
  | 'projects'
  | 'services'
  | 'site_settings'
  | 'skill_categories'
  | 'skills'
  | 'social_links'
  | 'technologies'

// Single-row site content.

export type Profile = Row<'profile'>
export type SiteSettings = Omit<Row<'site_settings'>, 'defaultTheme'> & {
  /**
   * Narrowed from the generated `string`.
   *
   * Postgres types `default_theme` as text with a check constraint, so the generated type
   * cannot know the three legal values. Overriding it here is what lets the settings form
   * treat a stored value as a `SelectField` option instead of an arbitrary string, and what
   * would catch a bad value arriving from the database as a type error.
   */
  defaultTheme: ThemeOption
}
export type AboutSection = Row<'about_sections'>

// Skills and the technology catalogue they draw from.

/**
 * `field` is narrowed from the generated `string`.
 *
 * Postgres types the column as `text` with a CHECK listing the two legal values, so the
 * generated type cannot know them. Overriding it here is what lets the UI treat a stored
 * value as a `FieldOption` and what would catch a bad value arriving from the database as a
 * type error.
 */
export type SkillCategory = Omit<Row<'skill_categories'>, 'field'> & { field: FieldOption }
export type Skill = Omit<Row<'skills'>, 'field'> & { field: FieldOption }
export type Technology = Row<'technologies'>

// Projects, with their images and technology links. The link tables are join rows, so
// they carry no id of their own and are never rendered directly.

export type Project = Omit<Row<'projects'>, 'field'> & { field: FieldOption }
export type ProjectImage = Row<'project_images'>
export type ProjectTechnology = Row<'project_technologies'>

/** A project with its relations resolved, for rendering a card or a detail page. */
export type ProjectWithRelations = Project & {
  images: ProjectImage[]
  technologies: Technology[]
}

// Career history.

export type Experience = Omit<Row<'experiences'>, 'field'> & { field: FieldOption }
export type Education = Row<'educations'>
export type Certificate = Omit<Row<'certificates'>, 'field'> & { field: FieldOption }
export type Service = Row<'services'>
export type SocialLink = Row<'social_links'>

// Messages and media.

export type ContactMessage = Row<'contact_messages'>
export type MediaAsset = Omit<Row<'media'>, 'bucket'> & {
  /**
   * Narrowed from the generated `string`. `media.bucket` is `text` with a CHECK listing
   * both bucket names, so the generated type cannot know them; `toStorageBucket` does the
   * narrowing at the service boundary.
   */
  bucket: StorageBucket
}

/**
 * The admin allowlist row, as the signed-in admin reads it. Not an admin capability: it
 * only reports whether the current session is on the list.
 */
export type AdminUser = Row<'admin_users'>