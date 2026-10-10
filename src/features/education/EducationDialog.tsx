import { EntityDialog } from '@/components/common/EntityDialog'
import { SwitchField, TextAreaField, TextField } from '@/components/common/FormField'
import { NumberField } from '@/components/common/FormControls'
import { ImageUploadField } from '@/components/common/ImageUploadField'
import { MEDIA_FOLDERS } from '@/features/media'
import { educationSchema, type EducationValues } from '@/schemas'
import type { Education } from '@/types/entities'

export const EMPTY_EDUCATION: EducationValues = {
  institution: '',
  degree: '',
  fieldOfStudy: '',
  description: '',
  logoPath: '',
  startDate: '',
  endDate: '',
  grade: '',
  sortOrder: 0,
  isPublished: false,
}

/** A stored entry as the form wants it. See `ExperienceDialog` for the same rule. */
export function educationToFormValues(entry: Education | null): EducationValues {
  if (!entry) return EMPTY_EDUCATION

  return {
    institution: entry.institution,
    degree: entry.degree,
    fieldOfStudy: entry.fieldOfStudy ?? '',
    description: entry.description ?? '',
    logoPath: entry.logoPath ?? '',
    startDate: entry.startDate ?? '',
    endDate: entry.endDate ?? '',
    grade: entry.grade ?? '',
    sortOrder: entry.sortOrder,
    isPublished: entry.isPublished,
  }
}

type EducationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: Education | null
  isSubmitting: boolean
  onSubmit: (values: EducationValues) => void
}

/** Create and edit dialog for an education entry. */
export function EducationDialog({
  open,
  onOpenChange,
  entry,
  isSubmitting,
  onSubmit,
}: EducationDialogProps) {
  const isEditing = entry !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit entry' : 'New entry'}
      description={
        isEditing
          ? 'Changes appear on the public site as soon as the entry is published.'
          : 'A new entry starts as a draft. Publish it when it is ready.'
      }
      schema={educationSchema}
      defaultValues={educationToFormValues(entry)}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Add entry'}
      isBusy={isSubmitting}
    >
      <div className="space-y-4">
        <TextField name="institution" label="Institution" required autoComplete="off" />
        <TextField name="degree" label="Degree" required autoComplete="off" />
        <TextField name="fieldOfStudy" label="Field of study" />
        <TextField name="grade" label="Grade" placeholder="GPA, grade, or distinction" />

        <TextAreaField name="description" label="Description" rows={4} />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="startDate" label="Start date" type="date" />
          <TextField name="endDate" label="End date" type="date" description="Empty while ongoing." />
          <NumberField name="sortOrder" label="Sort order" min={0} description="Lower appears first." />
        </div>

        <ImageUploadField
          name="logoPath"
          label="Institution logo"
          folder={MEDIA_FOLDERS.education}
          description="Optional. Shown beside the entry."
        />

        <SwitchField
          name="isPublished"
          label="Published"
          description="A draft stays out of the public timeline."
        />
      </div>
    </EntityDialog>
  )
}
