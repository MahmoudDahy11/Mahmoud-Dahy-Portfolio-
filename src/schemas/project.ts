import { z } from 'zod'
import { VALIDATION_LIMITS } from '@/constants/validation'
import {
  optionalDate,
  optionalText,
  optionalUrl,
  requiredText,
  slugField,
  sortOrderField,
} from './fields'

/**
 * A project.
 *
 * The hardest form in the dashboard, because a project owns three separate things: its own
 * columns, a set of technologies in a join table, and a gallery. All three are saved by one
 * `saveProject` call so the form either saves completely or not at all — a project that
 * saved without its technologies would look broken on the public page with no way for the
 * owner to tell why.
 *
 * `gallery` is an array of objects rather than a flat list because each image carries a
 * description that lives in `project_images` alongside it. The description is optional:
 * what is not optional is the image itself, so a row with no file is rejected while a row
 * with no description saves and is stored as NULL.
 */
export const projectSchema = z.object({
  title: requiredText('Title', VALIDATION_LIMITS.projectTitle),
  slug: slugField('Slug'),
  summary: optionalText(VALIDATION_LIMITS.projectSummary.max, 'Summary'),
  description: optionalText(VALIDATION_LIMITS.projectDescription.max, 'Description'),
  coverImagePath: optionalText(VALIDATION_LIMITS.url.max, 'Cover image'),
  repositoryUrl: optionalUrl('Repository URL'),
  liveUrl: optionalUrl('Live URL'),
  role: optionalText(VALIDATION_LIMITS.projectRole.max, 'Role'),
  clientName: optionalText(VALIDATION_LIMITS.projectClient.max, 'Client'),
  startedAt: optionalDate('Start date'),
  endedAt: optionalDate('End date'),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  sortOrder: sortOrderField,
  technologyIds: z.array(z.string()),
  gallery: z.array(
    z.object({
      path: z.string().min(1, { message: 'An image is required.' }),
      altText: optionalText(VALIDATION_LIMITS.imageAltText.max, 'Alt text'),
    }),
  ),
})

export type ProjectValues = z.infer<typeof projectSchema>
