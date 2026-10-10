import { EntityDialog } from '@/components/common/EntityDialog'
import { SwitchField, TextAreaField, TextField } from '@/components/common/FormField'
import { NumberField } from '@/components/common/FormControls'
import { ImageUploadField } from '@/components/common/ImageUploadField'
import { MEDIA_FOLDERS } from '@/features/media'
import { aboutSectionSchema, type AboutSectionValues } from '@/schemas'
import type { AboutSection } from '@/types/entities'

export const EMPTY_ABOUT_SECTION: AboutSectionValues = {
  title: '',
  content: '',
  imagePath: '',
  sortOrder: 0,
  isPublished: false,
}

/** A stored block as the form wants it. See `ExperienceDialog` for the same rule. */
export function aboutSectionToFormValues(section: AboutSection | null): AboutSectionValues {
  if (!section) return EMPTY_ABOUT_SECTION

  return {
    title: section.title,
    content: section.content,
    imagePath: section.imagePath ?? '',
    sortOrder: section.sortOrder,
    isPublished: section.isPublished,
  }
}

type AboutSectionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: AboutSection | null
  isSubmitting: boolean
  onSubmit: (values: AboutSectionValues) => void
}

/**
 * Create and edit dialog for an About page block.
 *
 * The About page is a list of these rather than one long text field, so the owner can add,
 * remove, and reorder sections without rewriting the page. `sortOrder` is therefore a field
 * on the form, not a detail left to the database: it is what decides the order the visitor
 * reads them in.
 */
export function AboutSectionDialog({
  open,
  onOpenChange,
  section,
  isSubmitting,
  onSubmit,
}: AboutSectionDialogProps) {
  const isEditing = section !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit section' : 'New section'}
      description="The About page is built from these blocks, in the order set here."
      schema={aboutSectionSchema}
      defaultValues={aboutSectionToFormValues(section)}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Add section'}
      isBusy={isSubmitting}
    >
      <div className="space-y-4">
        <TextField name="title" label="Title" required autoComplete="off" />

        <TextAreaField
          name="content"
          label="Content"
          rows={8}
          required
          description="Plain text. Line breaks are preserved; HTML is not rendered."
        />

        <ImageUploadField
          name="imagePath"
          label="Image"
          folder={MEDIA_FOLDERS.profile}
          description="Optional. Shown beside the text."
        />

        <NumberField name="sortOrder" label="Sort order" min={0} description="Lower appears first." />

        <SwitchField
          name="isPublished"
          label="Published"
          description="A draft stays out of the public About page."
        />
      </div>
    </EntityDialog>
  )
}
