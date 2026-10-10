import { EntityDialog } from '@/components/common/EntityDialog'
import { ProjectForm } from '@/features/projects/ProjectForm'
import { projectSchema, type ProjectValues } from '@/schemas'
import type { ProjectWithRelations, Technology } from '@/types/entities'

export const EMPTY_PROJECT: ProjectValues = {
  title: '',
  slug: '',
  summary: '',
  description: '',
  coverImagePath: '',
  repositoryUrl: '',
  liveUrl: '',
  role: '',
  clientName: '',
  startedAt: '',
  endedAt: '',
  isFeatured: false,
  isPublished: false,
  sortOrder: 0,
  technologyIds: [],
  gallery: [],
}

/**
 * A stored project as the form wants it.
 *
 * Two conversions happen here rather than in the form. The database stores an absent
 * optional value as `null`, while an empty form field is `''` — passing `null` to an
 * `<input>` renders the string "null", so every one of them is normalised on the way in.
 * And the boolean flags are not nullable in the schema, so a value that somehow is missing
 * becomes `false` rather than `undefined`.
 */
export function projectToFormValues(project: ProjectWithRelations): ProjectValues {
  return {
    ...EMPTY_PROJECT,
    title: project.title,
    slug: project.slug,
    summary: project.summary ?? '',
    description: project.description ?? '',
    coverImagePath: project.coverImagePath ?? '',
    repositoryUrl: project.repositoryUrl ?? '',
    liveUrl: project.liveUrl ?? '',
    role: project.role ?? '',
    clientName: project.clientName ?? '',
    startedAt: project.startedAt ?? '',
    endedAt: project.endedAt ?? '',
    isFeatured: project.isFeatured ?? false,
    isPublished: project.isPublished ?? false,
    sortOrder: project.sortOrder ?? 0,
    technologyIds: project.technologies.map((technology) => technology.id),
    gallery: (project.images ?? []).map((image) => ({
      path: image.path,
      // Stored as NULL when the owner left the description blank, and the form holds ''.
      altText: image.altText ?? '',
    })),
  }
}

type ProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The project being edited, with its relations, or `null` for a new one. */
  project: ProjectWithRelations | null
  technologies: Technology[]
  isSubmitting: boolean
  onSubmit: (values: ProjectValues) => void
}

/**
 * Create and edit dialog for a project.
 *
 * One component for both, because the fields, the validation, and the layout are identical;
 * only the starting values and the title differ. Everything the form needs is derived from
 * the `project` prop, so the page does not have to build a second copy of the form for the
 * create case.
 */
export function ProjectDialog({
  open,
  onOpenChange,
  project,
  technologies,
  isSubmitting,
  onSubmit,
}: ProjectDialogProps) {
  const isEditing = project !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit project' : 'New project'}
      description={
        isEditing
          ? 'Changes are live as soon as the project is published.'
          : 'A new project starts as a draft. Publish it when it is ready.'
      }
      schema={projectSchema}
      defaultValues={isEditing ? projectToFormValues(project) : EMPTY_PROJECT}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Create project'}
      isBusy={isSubmitting}
      size="lg"
    >
      <ProjectForm technologies={technologies} />
    </EntityDialog>
  )
}
