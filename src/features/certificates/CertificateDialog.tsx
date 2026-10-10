import { EntityDialog } from '@/components/common/EntityDialog'
import { SwitchField, TextField } from '@/components/common/FormField'
import { NumberField } from '@/components/common/FormControls'
import { ImageUploadField } from '@/components/common/ImageUploadField'
import { MEDIA_FOLDERS } from '@/features/media'
import { certificateSchema, type CertificateValues } from '@/schemas'
import type { Certificate } from '@/types/entities'

export const EMPTY_CERTIFICATE: CertificateValues = {
  title: '',
  issuer: '',
  issuedOn: '',
  credentialId: '',
  credentialUrl: '',
  imagePath: '',
  sortOrder: 0,
  isPublished: false,
}

/** A stored certificate as the form wants it. See `ExperienceDialog` for the same rule. */
export function certificateToFormValues(certificate: Certificate | null): CertificateValues {
  if (!certificate) return EMPTY_CERTIFICATE

  return {
    title: certificate.title,
    issuer: certificate.issuer ?? '',
    issuedOn: certificate.issuedOn ?? '',
    credentialId: certificate.credentialId ?? '',
    credentialUrl: certificate.credentialUrl ?? '',
    imagePath: certificate.imagePath ?? '',
    sortOrder: certificate.sortOrder,
    isPublished: certificate.isPublished,
  }
}

type CertificateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  certificate: Certificate | null
  isSubmitting: boolean
  onSubmit: (values: CertificateValues) => void
}

/**
 * Create and edit dialog for a certificate.
 *
 * The image and the credential URL are both optional, and neither is required, because plenty
 * of certificates have one, the other, or neither. The form never asks for a link the owner
 * does not have.
 */
export function CertificateDialog({
  open,
  onOpenChange,
  certificate,
  isSubmitting,
  onSubmit,
}: CertificateDialogProps) {
  const isEditing = certificate !== null

  return (
    <EntityDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Edit certificate' : 'New certificate'}
      description={
        isEditing
          ? 'Changes appear on the public site as soon as the certificate is published.'
          : 'A new certificate starts as a draft. Publish it when it is ready.'
      }
      schema={certificateSchema}
      defaultValues={certificateToFormValues(certificate)}
      onSubmit={onSubmit}
      submitLabel={isEditing ? 'Save changes' : 'Add certificate'}
      isBusy={isSubmitting}
    >
      <div className="space-y-4">
        <TextField name="title" label="Title" required autoComplete="off" />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="issuer" label="Issuer" />
          <TextField name="issuedOn" label="Issue date" type="date" />
          <TextField name="credentialId" label="Credential ID" />
          <TextField
            name="credentialUrl"
            label="Credential URL"
            type="url"
            placeholder="https://…"
            description="The issuer's own verification page."
          />
        </div>

        <ImageUploadField
          name="imagePath"
          label="Badge image"
          folder={MEDIA_FOLDERS.certificates}
          description="Shown on the public certificates page."
        />

        <NumberField name="sortOrder" label="Sort order" min={0} description="Lower appears first." />

        <SwitchField
          name="isPublished"
          label="Published"
          description="A draft stays out of the public certificates page."
        />
      </div>
    </EntityDialog>
  )
}
