import { EntityDialog } from '@/components/common/EntityDialog'
import { TextField } from '@/components/common/FormField'
import { NumberField } from '@/components/common/FormControls'
import { SlugField } from '@/components/common/SlugField'
import { ImageUploadField } from '@/components/common/ImageUploadField'
import { MEDIA_FOLDERS } from '@/features/media'
import { technologySchema, type TechnologyValues } from '@/schemas'
import type { Technology } from '@/types/entities'

export const EMPTY_TECHNOLOGY: TechnologyValues = {
  name: '',
  slug: '',
  iconPath: '',
  sortOrder: 0,
}

/** A stored technology as the form wants it. */
export function technologyToFormValues(technology: Technology | null): TechnologyValues {
  if (!technology) return EMPTY_TECHNOLOGY

  return {
    name: technology.name,
    slug: technology.slug,
    iconPath: technology.iconPath ?? '',
    sortOrder: technology.sortOrder,
  }
}

type TechnologyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  technology: Technology | null
  isSubmitting: boolean
  onSubmit: (values: TechnologyValues) => void
}

/**
 * Create and edit dialog for a technology.
 *
 * Technologies are the filter chips on the public projects page, and `project_technologies`
 * links projects to them. So this has no published flag either: a technology is reachable by
 * a visitor only through a published project that uses it, and adding one here makes it
 * immediately selectable in the project form.
 */
export function TechnologyDialog({
  open,
  onOpenChange,
  technology,
  isSubmitting,
  onSubmit,
}: TechnologyDialogProps) {
  const isEditing = technology !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit technology' : 'New technology'}
      description="Technologies become the filter chips on the public projects page."
      schema={technologySchema}
      defaultValues={technologyToFormValues(technology)}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Add technology'}
      isBusy={isSubmitting}
    >
      <div className="space-y-4">
        <TextField name="name" label="Name" required autoComplete="off" />
        <SlugField name="slug" titleField="name" />

        <ImageUploadField
          name="iconPath"
          label="Icon"
          folder={MEDIA_FOLDERS.technologies}
          description="Optional. A small square image reads best on a project card."
        />

        <NumberField name="sortOrder" label="Sort order" min={0} description="Lower appears first." />
      </div>
    </EntityDialog>
  )
}
