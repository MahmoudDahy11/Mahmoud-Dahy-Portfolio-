import { EntityDialog } from '@/components/common/EntityDialog'
import { SwitchField, TextAreaField, TextField } from '@/components/common/FormField'
import { NumberField, SelectField } from '@/components/common/FormControls'
import { FIELD_SELECT_OPTIONS } from '@/constants/validation'
import { experienceSchema, type ExperienceValues } from '@/schemas'
import type { Experience } from '@/types/entities'

export const EMPTY_EXPERIENCE: ExperienceValues = {
  company: '',
  title: '',
  description: '',
  location: '',
  employmentType: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  sortOrder: 0,
  isPublished: false,
  field: 'software',
}

/**
 * A stored role as the form wants it.
 *
 * The database stores an absent optional value as `null`, and passing `null` to an `<input>`
 * renders the word "null" in the field, so every optional value is normalised to `''` on the
 * way in. `isPublished` defaults to `false` rather than following the database default of
 * `true`, because a role added here should be reviewed before it appears on the site.
 */
export function experienceToFormValues(role: Experience | null): ExperienceValues {
  if (!role) return EMPTY_EXPERIENCE

  return {
    company: role.company,
    title: role.title,
    description: role.description ?? '',
    location: role.location ?? '',
    employmentType: role.employmentType ?? '',
    startDate: role.startDate,
    endDate: role.endDate ?? '',
    isCurrent: role.isCurrent,
    sortOrder: role.sortOrder,
    isPublished: role.isPublished,
    field: role.field,
  }
}

type ExperienceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Experience | null
  isSubmitting: boolean
  onSubmit: (values: ExperienceValues) => void
}

/**
 * Create and edit dialog for a role.
 *
 * One component for both cases, because only the starting values and the title differ. The
 * dialog-state rules — reset on open, stay open on a failed save, disable while saving — all
 * live in `EntityDialog`, so this file is only the fields and the two-way conversion.
 */
export function ExperienceDialog({
  open,
  onOpenChange,
  role,
  isSubmitting,
  onSubmit,
}: ExperienceDialogProps) {
  const isEditing = role !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit role' : 'New role'}
      description={
        isEditing
          ? 'Changes appear on the public site as soon as the role is published.'
          : 'A new role starts as a draft. Publish it when it is ready.'
      }
      schema={experienceSchema}
      defaultValues={experienceToFormValues(role)}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Add role'}
      isBusy={isSubmitting}
    >
      <div className="space-y-4">
        <TextField name="company" label="Company" required autoComplete="off" />
        <TextField name="title" label="Job title" required autoComplete="off" />

        <TextAreaField
          name="description"
          label="Description"
          rows={5}
          description="What you did there. Plain text — links are not rendered."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="location" label="Location" />
          <TextField name="employmentType" label="Employment type" placeholder="Full-time" />
          <TextField name="startDate" label="Start date" type="date" required />
          <TextField
            name="endDate"
            label="End date"
            type="date"
            description="Leave empty for a current role."
          />
          <SelectField
            name="field"
            label="Field"
            options={FIELD_SELECT_OPTIONS}
            description="The Software or ELV track this role belongs to."
          />
          <NumberField name="sortOrder" label="Sort order" min={0} description="Lower appears first." />
        </div>

        <SwitchField
          name="isCurrent"
          label="This is my current role"
          description="Shown with an 'Present' marker instead of an end date."
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
