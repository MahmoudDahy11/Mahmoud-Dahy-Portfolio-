import { EntityDialog } from '@/components/common/EntityDialog'
import { SwitchField, TextAreaField, TextField } from '@/components/common/FormField'
import { NumberField } from '@/components/common/FormControls'
import { ImageUploadField } from '@/components/common/ImageUploadField'
import { MEDIA_FOLDERS } from '@/features/media'
import { serviceSchema, type ServiceValues } from '@/schemas'
import type { Service } from '@/types/entities'

export const EMPTY_SERVICE: ServiceValues = {
  title: '',
  description: '',
  iconPath: '',
  priceHint: '',
  sortOrder: 0,
  isPublished: false,
}

/** A stored service as the form wants it. See `ExperienceDialog` for the same rule. */
export function serviceToFormValues(service: Service | null): ServiceValues {
  if (!service) return EMPTY_SERVICE

  return {
    title: service.title,
    description: service.description,
    iconPath: service.iconPath ?? '',
    priceHint: service.priceHint ?? '',
    sortOrder: service.sortOrder,
    isPublished: service.isPublished,
  }
}

type ServiceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  isSubmitting: boolean
  onSubmit: (values: ServiceValues) => void
}

/** Create and edit dialog for a service. */
export function ServiceDialog({
  open,
  onOpenChange,
  service,
  isSubmitting,
  onSubmit,
}: ServiceDialogProps) {
  const isEditing = service !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit service' : 'New service'}
      description={
        isEditing
          ? 'Changes appear on the public site as soon as the service is published.'
          : 'A new service starts as a draft. Publish it when it is ready.'
      }
      schema={serviceSchema}
      defaultValues={serviceToFormValues(service)}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Add service'}
      isBusy={isSubmitting}
    >
      <div className="space-y-4">
        <TextField name="title" label="Title" required autoComplete="off" />
        <TextAreaField name="description" label="Description" rows={5} required />
        <TextField
          name="priceHint"
          label="Price hint"
          description="Free text, so 'From $500', 'Negotiable', and 'Contact me' all work."
        />
        <NumberField name="sortOrder" label="Sort order" min={0} description="Lower appears first." />

        <ImageUploadField
          name="iconPath"
          label="Icon"
          folder={MEDIA_FOLDERS.misc}
          description="Optional. A small square image reads best here."
        />

        <SwitchField
          name="isPublished"
          label="Published"
          description="A draft stays out of the public services page."
        />
      </div>
    </EntityDialog>
  )
}
